<?php
declare(strict_types=1);
function sp_sign(string $raw): string { return base64_encode(hash_hmac('sha384',$raw,(string)cfg('SIMPLEPAY_SECRET_KEY'),true)); }
function sp_valid(string $raw,string $signature): bool { return cfg('SIMPLEPAY_SECRET_KEY')!=='' && hash_equals(sp_sign($raw),$signature); }
function payment_start(array $b): array {
    $id=required($b,'order_id',80);
    if(!cfg('SIMPLEPAY_MERCHANT_ID')||!cfg('SIMPLEPAY_SECRET_KEY')||!cfg('PUBLIC_SITE_URL')) fail(503,'payment_not_configured');
    $reservation=tx(function() use($id) {
        $o=need('orders',$id,true);
        if($o['payment_status']==='PAID') return ['done'=>['paymentUrl'=>null,'status'=>'PAID','order_id'=>$id]];
        if($o['fulfillment_status']==='CANCELLED') fail(409,'order_cancelled');
        $a=sql("SELECT * FROM payment_attempts WHERE order_id=? AND state IN ('STARTING','REDIRECTING','UNKNOWN') AND expires_at>? ORDER BY created_at DESC LIMIT 1",[$id,time()])->fetch();
        if($a) {
            if($a['state']==='REDIRECTING') return ['done'=>['paymentUrl'=>$a['payment_url'],'status'=>'REDIRECTING','order_id'=>$id]];
            fail(409,'payment_start_pending');
        }
        $ref=$id.'-'.bin2hex(random_bytes(8));
        sql('INSERT INTO payment_attempts (order_ref,order_id,state,expires_at,created_at) VALUES (?,?,\'STARTING\',?,?)',[$ref,$id,time()+900,now()]);
        return ['order'=>$o,'ref'=>$ref];
    });
    if(isset($reservation['done'])) return $reservation['done'];
    $o=$reservation['order']; $ref=$reservation['ref'];
    $payload=['salt'=>bin2hex(random_bytes(16)),'merchant'=>cfg('SIMPLEPAY_MERCHANT_ID'),'orderRef'=>$ref,
        'customer'=>$o['full_name'],'customerEmail'=>$o['email'],'language'=>$o['lang']==='hu'?'HU':'EN','currency'=>'HUF','total'=>$o['total'],'methods'=>['CARD'],
        'timeout'=>gmdate('Y-m-d\TH:i:s+00:00',time()+900),'url'=>rtrim((string)cfg('PUBLIC_SITE_URL'),'/').'/order/'.$id,
        'sdkVersion'=>'SimplePayV2.1_Payment_PHP_Custom',
        'invoice'=>['name'=>$o['full_name'],'country'=>'HU','state'=>'','city'=>$o['city'],'zip'=>$o['postal_code'],'address'=>$o['address']]];
    $raw=json($payload); $data=[]; $err=null;
    try {
        $r=http_request(rtrim((string)cfg('SIMPLEPAY_BASE_URL','https://sandbox.simplepay.hu/payment/v2'),'/').'/start',$raw,['Content-Type: application/json','Signature: '.sp_sign($raw)]);
        if($r['status']<200||$r['status']>=300||!sp_valid($r['body'],$r['headers']['signature']??'')) throw new RuntimeException('Invalid gateway response');
        $data=json_decode($r['body'],true,512,JSON_THROW_ON_ERROR);
        if(!empty($data['paymentUrl'])) {
            if(parse_url($data['paymentUrl'],PHP_URL_SCHEME)!=='https') throw new RuntimeException('Invalid payment URL');
            if(empty($data['transactionId'])) throw new RuntimeException('Missing transaction ID');
        }
    } catch(Throwable $e) { $err='gateway_unreachable_or_unverified'; }
    return tx(function() use($id,$ref,$data,$err) {
        $o=need('orders',$id,true);
        $a=sql('SELECT * FROM payment_attempts WHERE order_ref=? FOR UPDATE',[$ref])->fetch();
        // An IPN may arrive before the HTTP start response. Never undo its terminal result.
        if(in_array($a['state'],['STARTING','UNKNOWN'],true)) sql('UPDATE payment_attempts SET state=?,transaction_id=?,payment_url=? WHERE order_ref=?',[
            $err?'UNKNOWN':(!empty($data['paymentUrl'])?'REDIRECTING':'FAILED'),isset($data['transactionId'])?(string)$data['transactionId']:null,$data['paymentUrl']??null,$ref]);
        if($o['payment_status']==='PAID') return ['paymentUrl'=>null,'status'=>'PAID','order_id'=>$id];
        if($o['fulfillment_status']==='CANCELLED') return ['paymentUrl'=>null,'status'=>'CANCELLED','order_id'=>$id];
        if($err||empty($data['paymentUrl'])) {
            $o['status']='RESERVED'; $o['payment_status']='RESERVED'; save('orders',$o);
            return ['paymentUrl'=>null,'status'=>'RESERVED','message'=>$err??'start_failed'];
        }
        $o['order_ref']=$ref; $o['transaction_id']=$data['transactionId']; save('orders',$o);
        return ['paymentUrl'=>$data['paymentUrl'],'status'=>'REDIRECTING','order_id'=>$id];
    });
}
function payment_return(array $b): array {
    $raw=base64_decode(text_field($b,'r'),true);
    if($raw===false||!sp_valid($raw,text_field($b,'s'))) fail(400,'invalid_signature');
    $d=json_decode($raw,true,512,JSON_THROW_ON_ERROR);
    $a=sql('SELECT order_id FROM payment_attempts WHERE order_ref=?',[$d['o']??''])->fetch();
    if(!$a) fail(404,'unknown_payment');
    return ['event'=>$d['e']??null,'order_id'=>$a['order_id'],'transaction_id'=>$d['t']??null];
}
function payment_ipn(string $raw): never {
    if(!sp_valid($raw,$_SERVER['HTTP_SIGNATURE']??'')) fail(400,'invalid_signature');
    $msg=json_decode($raw,true,512,JSON_THROW_ON_ERROR);
    if(!is_array($msg)) fail(400,'invalid_ipn');
    if((string)($msg['merchant']??'')!==(string)cfg('SIMPLEPAY_MERCHANT_ID')) fail(400,'merchant_mismatch');
    $ref=required($msg,'orderRef',120); $status=required($msg,'status');
    $a=sql('SELECT order_id FROM payment_attempts WHERE order_ref=?',[$ref])->fetch();
    if(!$a) fail(404,'unknown_payment');
    tx(function() use($a,$msg,$ref,$status) {
        $o=need('orders',$a['order_id'],true);
        $attempt=sql('SELECT * FROM payment_attempts WHERE order_ref=? FOR UPDATE',[$ref])->fetch();
        if(empty($msg['transactionId'])) fail(400,'missing_transaction');
        if($attempt['transaction_id']!==null&&(string)$attempt['transaction_id']!==(string)$msg['transactionId']) fail(400,'transaction_mismatch');
        if(isset($msg['currency'])&&$msg['currency']!=='HUF') fail(400,'currency_mismatch');
        if(isset($msg['total'])&&(!is_numeric($msg['total'])||(float)$msg['total']!==(float)$o['total'])) fail(400,'amount_mismatch');
        if($attempt['state']==='FINISHED') return;
        sql('UPDATE payment_attempts SET state=?,transaction_id=? WHERE order_ref=?',[$status,(string)$msg['transactionId'],$ref]);
        if($o['payment_status']==='PAID') {
            if($status==='FINISHED'&&(string)($o['transaction_id']??'')!==(string)$msg['transactionId']) {
                $o['payment_review_required']=true;
                $o['history'][]=['at'=>now(),'event'=>'additional_successful_payment','transaction_id'=>$msg['transactionId']];
                save('orders',$o);
            }
            return; // Late failures must never regress a successful payment.
        }
        if($status==='FINISHED') {
            $o['status']='FINISHED'; $o['payment_status']='PAID'; $o['paid_at']=now(); $o['transaction_id']=$msg['transactionId'];
            if(in_array($o['fulfillment_status'],['NEW','AWAITING_PAYMENT'],true)) $o['fulfillment_status']='PAID';
            if($o['fulfillment_status']==='CANCELLED') $o['payment_review_required']=true; // Admin refund/reconciliation; do not re-reserve stock.
            queue_event('payment_success',$o); queue_event('admin_paid',$o); invoice_check($o,'paid');
        } elseif(in_array($status,['CANCELLED','TIMEOUT','NOTAUTHORIZED','FAIL'],true)) {
            // An old attempt's failure cannot overwrite a newer attempt.
            if(isset($o['order_ref'])&&$o['order_ref']!==$ref) return;
            $o['status']=$status; $o['payment_status']='FAILED'; queue_event('payment_failed',$o); queue_event('admin_payment_failed',$o);
        } else return;
        $o['history'][]=['at'=>now(),'event'=>'ipn:'.$status]; save('orders',$o);
    });
    $msg['receiveDate']=gmdate('Y-m-d\TH:i:s+0000'); $ack=json($msg);
    header('Content-Type: application/json; charset=utf-8'); header('Signature: '.sp_sign($ack)); echo $ack; exit;
}
