<?php
declare(strict_types=1);
function payment_provider(): string { return (string)cfg('PAYMENT_PROVIDER','barion'); }
function barion_mode(): string { return cfg('BARION_ENV','sandbox')==='live'?'live':'sandbox'; }
function barion_key(?string $mode=null): string { return (string)cfg(($mode??barion_mode())==='live'?'BARION_POS_KEY':'BARION_TEST_POS_KEY'); }
function barion_payee(?string $mode=null): string { return (string)cfg(($mode??barion_mode())==='live'?'BARION_PAYEE_EMAIL':'BARION_TEST_PAYEE_EMAIL'); }
function payment_enabled(): bool {
    if(payment_provider()==='simplepay') return cfg('SIMPLEPAY_MERCHANT_ID')!==''&&cfg('SIMPLEPAY_SECRET_KEY')!=='';
    return payment_provider()==='barion'&&filter_var(cfg('BARION_ENABLED',false),FILTER_VALIDATE_BOOLEAN)&&barion_key()!==''&&filter_var(barion_payee(),FILTER_VALIDATE_EMAIL)!==false;
}
function payment_config(): array { return ['payment_provider'=>payment_provider(),'payment_mode'=>payment_provider()==='barion'?barion_mode():(str_contains((string)cfg('SIMPLEPAY_BASE_URL','sandbox'),'sandbox')?'sandbox':'live'),'payment_enabled'=>payment_enabled(),'barion_pixel_enabled'=>payment_provider()==='barion'&&filter_var(cfg('BARION_PIXEL_ENABLED',false),FILTER_VALIDATE_BOOLEAN),'barion_pixel_id'=>(string)cfg(barion_mode()==='live'?'BARION_PIXEL_ID':'BARION_TEST_PIXEL_ID')]; }
function barion_call(string $path,array $body,string $mode,string $method='POST'): array {
    $host=$mode==='live'?'https://api.barion.com':'https://api.test.barion.com';
    $r=http_request($host.$path,$method==='GET'?'':json($body),['Content-Type: application/json','x-pos-key: '.barion_key($mode)],$method);
    if($r['status']<200||$r['status']>=300) throw new RuntimeException('barion_http_error');
    $d=json_decode($r['body'],true,512,JSON_THROW_ON_ERROR);
    if(!is_array($d)||!empty($d['Errors'])) throw new RuntimeException('barion_response_error');
    return $d;
}
function barion_payload(array $o,string $ref,string $mode): array {
    $site=rtrim((string)cfg('PUBLIC_SITE_URL'),'/');
    if(parse_url($site,PHP_URL_SCHEME)!=='https') fail(503,'https_required');
    // One aggregate item includes the server-calculated coupon and shipping, so totals always agree.
    return ['POSKey'=>barion_key($mode),'PaymentType'=>'Immediate','PaymentWindow'=>'00:30:00','FundingSources'=>['All'],
        'PaymentRequestId'=>$ref,'OrderNumber'=>$o['order_id'],'PayerHint'=>$o['email'],'Locale'=>$o['lang']==='en'?'en-US':'hu-HU','Currency'=>'HUF',
        'RedirectUrl'=>$site.'/order/'.$o['order_id'].'?barion=1','CallbackUrl'=>$site.'/api/payments/barion/callback',
        'Transactions'=>[['POSTransactionId'=>$ref,'Payee'=>barion_payee($mode),'Total'=>$o['total'],'Comment'=>'HINFINI '.$o['order_id'],
            'Items'=>[['Name'=>'HINFINI rendelés','Description'=>'Termékek, kedvezmény és szállítás / Products, discount and shipping','Quantity'=>1,'Unit'=>'db','UnitPrice'=>$o['total'],'ItemTotal'=>$o['total']]]]]];
}
function barion_start(array $b): array {
    if(!payment_enabled()) fail(503,'payment_not_configured');
    $id=required($b,'order_id',80);$mode=barion_mode();
    $r=tx(function()use($id,$mode){
        $o=need('orders',$id,true);
        if($o['payment_status']==='PAID')return ['done'=>['status'=>'PAID','paymentUrl'=>null,'order_id'=>$id]];
        if($o['fulfillment_status']==='CANCELLED')fail(409,'order_cancelled');
        // Unresolved starts never get replaced automatically: the previous request may have reached Barion.
        $a=sql("SELECT * FROM payment_attempts WHERE order_id=? AND state IN ('STARTING','UNKNOWN','REDIRECTING') ORDER BY created_at DESC LIMIT 1",[$id])->fetch();
        if($a){
            if($a['state']==='REDIRECTING'&&(int)$a['expires_at']>time())return ['done'=>['status'=>'REDIRECTING','paymentUrl'=>$a['payment_url'],'order_id'=>$id]];
            fail(409,'payment_start_pending');
        }
        $ref='barion_'.bin2hex(random_bytes(16));
        $o['order_ref']=$ref;$o['payment_provider']='barion';$o['payment_environment']=$mode;
        save('orders',$o);
        sql("INSERT INTO payment_attempts (order_ref,order_id,state,expires_at,created_at) VALUES (?,?,'STARTING',?,?)",[$ref,$id,time()+1800,now()]);
        return ['order'=>$o,'ref'=>$ref];
    });
    if(isset($r['done']))return $r['done'];
    $ref=$r['ref'];
    try {
        $d=barion_call('/v2/Payment/Start',barion_payload($r['order'],$ref,$mode),$mode);
        $pid=$d['PaymentId']??'';
        if(!is_string($pid)||!preg_match('/^[a-f0-9-]{36}$/i',$pid))throw new RuntimeException('invalid_payment_id');
        $url=($mode==='live'?'https://secure.barion.com/Pay?id=':'https://secure.test.barion.com/Pay?id=').rawurlencode($pid);
    }catch(Throwable $e){sql("UPDATE payment_attempts SET state='UNKNOWN' WHERE order_ref=? AND state='STARTING'",[$ref]);fail(502,'payment_start_pending');}
    return tx(function()use($id,$ref,$pid,$url){
        $o=need('orders',$id,true);
        $a=sql('SELECT * FROM payment_attempts WHERE order_ref=? FOR UPDATE',[$ref])->fetch();
        if(!empty($a['transaction_id'])&&$a['transaction_id']!==$pid)fail(409,'payment_mismatch');
        if(in_array($a['state'],['STARTING','UNKNOWN'],true))sql("UPDATE payment_attempts SET transaction_id=?,payment_url=?,state='REDIRECTING' WHERE order_ref=?",[$pid,$url,$ref]);
        if($o['payment_status']==='PAID')return ['status'=>'PAID','paymentUrl'=>null,'order_id'=>$id];
        if($o['fulfillment_status']==='CANCELLED')return ['status'=>'CANCELLED','paymentUrl'=>null,'order_id'=>$id];
        return ['status'=>'REDIRECTING','paymentUrl'=>$url,'order_id'=>$id];
    });
}
// Only accepts a response obtained from Barion with our secret key, never callback status fields.
function barion_apply(array $d,string $pid,string $mode): void {
    if(($d['PaymentId']??'')!==$pid||($d['Currency']??'')!=='HUF'||($d['PaymentType']??'')!=='Immediate')fail(400,'payment_mismatch');
    $ref=$d['PaymentRequestId']??'';
    if(!is_string($ref)||!str_starts_with($ref,'barion_'))fail(400,'payment_mismatch');
    $a=sql('SELECT * FROM payment_attempts WHERE order_ref=?',[$ref])->fetch();if(!$a)fail(404,'unknown_payment');
    tx(function()use($a,$d,$pid,$mode,$ref){
        $o=need('orders',$a['order_id'],true);
        $attempt=sql('SELECT * FROM payment_attempts WHERE order_ref=? FOR UPDATE',[$ref])->fetch();
        if(($o['payment_environment']??'')!==$mode||($d['OrderNumber']??'')!==$o['order_id']||!is_numeric($d['Total']??null)||(float)$d['Total']!==(float)$o['total']||strtolower((string)($d['POSOwnerEmail']??''))!==strtolower(barion_payee($mode)))fail(400,'payment_mismatch');
        if($attempt['transaction_id']!==null&&$attempt['transaction_id']!==$pid)fail(400,'payment_mismatch');
        $status=$d['Status']??'';
        if(!in_array($status,['Succeeded','Canceled','Expired','Failed'],true))return;
        if($attempt['state']==='FINISHED')return;
        sql('UPDATE payment_attempts SET state=?,transaction_id=? WHERE order_ref=?',[$status==='Succeeded'?'FINISHED':'FAILED',$pid,$ref]);
        if($o['payment_status']==='PAID'){
            if($status==='Succeeded'&&($o['transaction_id']??'')!==$pid){$o['payment_review_required']=true;save('orders',$o);}return;
        }
        if($status==='Succeeded'){
            $o['status']='FINISHED';$o['payment_status']='PAID';$o['paid_at']=now();$o['transaction_id']=$pid;
            if($o['fulfillment_status']==='CANCELLED')$o['payment_review_required']=true;
            else $o['fulfillment_status']='PAID';
            queue_event('payment_success',$o);queue_event('admin_paid',$o);
            if(empty($o['payment_review_required']))invoice_check($o,'paid');
        }else{
            if(($o['order_ref']??'')!==$ref)return;
            $o['payment_status']='FAILED';$o['status']=$status;queue_event('payment_failed',$o);queue_event('admin_payment_failed',$o);
        }
        $o['history'][]=['at'=>now(),'event'=>'barion:'.$status];save('orders',$o);
    });
}
function barion_refresh(string $pid,?string $mode=null): void {
    if(!preg_match('/^[a-f0-9-]{36}$/i',$pid))fail(422,'invalid_payment_id');
    $known=sql("SELECT o.document FROM payment_attempts a JOIN orders o ON o.order_id=a.order_id WHERE a.transaction_id=? AND a.order_ref LIKE 'barion_%' LIMIT 1",[$pid])->fetchColumn();
    if($mode===null&&$known)$mode=json_decode($known,true)['payment_environment']??null;
    $mode??=barion_mode();if(barion_key($mode)==='')fail(503,'payment_not_configured');
    $d=barion_call('/v4/Payment/'.rawurlencode($pid).'/PaymentState',[],$mode,'GET');barion_apply($d,$pid,$mode);
}
function barion_poll(array $b): array {
    $o=need('orders',required($b,'order_id',80));
    if(($o['payment_provider']??'')==='barion'&&$o['payment_status']!=='PAID'){
        $a=sql('SELECT * FROM payment_attempts WHERE order_ref=?',[$o['order_ref']??''])->fetch();
        if($a&&!empty($a['transaction_id'])){public_limit('payment_poll',120);barion_refresh($a['transaction_id'],$o['payment_environment']);}
    }
    return public_order(need('orders',$o['order_id']));
}
function barion_reconcile(): int {
    $count=0;
    foreach(sql("SELECT a.*,o.document FROM payment_attempts a JOIN orders o ON o.order_id=a.order_id WHERE a.order_ref LIKE 'barion_%' AND a.state IN ('REDIRECTING','UNKNOWN') AND a.transaction_id IS NOT NULL ORDER BY a.created_at LIMIT 25")->fetchAll() as $a){
        try{$o=json_decode($a['document'],true);barion_refresh($a['transaction_id'],$o['payment_environment']);$count++;}catch(Throwable $e){error_log('Barion reconciliation failed for '.$a['order_ref']);}
    }return $count;
}
