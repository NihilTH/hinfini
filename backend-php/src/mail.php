<?php
declare(strict_types=1);
function http_request(string $url,string $body,array $headers=[],string $method='POST'): array {
    if(!str_starts_with($url,'https://')) throw new RuntimeException('HTTPS required');
    $responseHeaders=[]; $ch=curl_init($url);
    curl_setopt_array($ch,[CURLOPT_CUSTOMREQUEST=>$method,CURLOPT_POSTFIELDS=>$body,CURLOPT_HTTPHEADER=>$headers,CURLOPT_RETURNTRANSFER=>true,
        CURLOPT_CONNECTTIMEOUT=>5,CURLOPT_TIMEOUT=>20,CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS,CURLOPT_FOLLOWLOCATION=>false,
        CURLOPT_HEADERFUNCTION=>function($ch,$line) use(&$responseHeaders) { if(str_contains($line,':')) { [$k,$v]=explode(':',$line,2); $responseHeaders[strtolower(trim($k))]=trim($v); } return strlen($line); }]);
    $response=curl_exec($ch); $status=curl_getinfo($ch,CURLINFO_HTTP_CODE);
    if($response===false) { curl_close($ch); throw new RuntimeException('Provider connection failed'); }
    curl_close($ch); return ['body'=>$response,'status'=>$status,'headers'=>$responseHeaders];
}
function mail_template(string $event,array $e): array {
    $titles=['order_created'=>'Rendelésed megérkezett','payment_success'=>'Sikeres fizetés','payment_failed'=>'A fizetés nem fejeződött be',
        'shipped'=>'Úton van a rendelésed','cancelled'=>'Rendelés törölve','admin_new_order'=>'Új rendelés','admin_paid'=>'Sikeres fizetés',
        'admin_payment_failed'=>'Sikertelen fizetés','admin_cancel_request'=>'Törölt rendelés','admin_low_stock'=>'Alacsony készlet','custom_received'=>'Megkaptuk az egyedi ajánlatkérésedet','admin_custom'=>'Új egyedi gyertya ajánlatkérés','custom_quote'=>'Ajánlat az egyedi gyertyádra','invoice_ready'=>'Elkészült a számlád'];
    if(!isset($titles[$event])) throw new LogicException('Unknown email event');
    $title=$titles[$event]; $id=$e['order_id']??$e['product_id'];
    $text=$title." – H'INFINI #".$id."\n\n";
    if(in_array($event,['custom_received','admin_custom','custom_quote'],true)) {
        $text.='Név: '.$e['full_name']."\nE-mail: ".$e['email']."\nIllat: ".$e['scent']."\nTartó: ".$e['container']."\nFelirat: ".$e['text']."\nSzövegszín: ".$e['color']."\nElképzelés: ".$e['idea']."\n";
        if($event==='custom_quote')$text.="\nAjánlat: ".$e['quote']['amount']." Ft (teljes fizetendő összeg)\n".$e['quote']['message']."\n\nFizetés kizárólag átutalással.\nKedvezményezett: ".cfg('BANK_ACCOUNT_NAME')."\nBankszámlaszám: ".cfg('BANK_ACCOUNT_NUMBER')."\nKözlemény: ".$id;
        elseif($event==='custom_received')$text.="\nEz egy ajánlatkérés. Az árat és az átutalási adatokat külön e-mailben küldjük; most még nem kell fizetned.";
        else $text.="\nA vásárló képét és az ajánlatküldést a kezelőfelületen találod: ".rtrim((string)cfg('PUBLIC_SITE_URL'),'/').'/admin?tab=custom';
    }
    elseif($event==='admin_low_stock') $text.=$e['name'].' — készlet: '.$e['stock'];
    else {
        if(!str_starts_with($event,'admin_')) $text.='Kedves '.$e['full_name']."!\n\n";
        foreach($e['items'] as $i) $text.=$i['name'].' × '.$i['quantity'].' — '.number_format($i['line_total'],0,',',' ')." Ft\n";
        if(!empty($e['discount']))$text.="\nKuponkedvezmény (".$e['coupon_code']."): -".$e['discount']." Ft\n";
        if($event==='invoice_ready')$text.="\nSzámlaszám: ".$e['invoice']['number']."\nSzámla letöltése: ".$e['invoice']['url']."\n";
        $text.="\nSzállítás: ".$e['shipping']." Ft\nVégösszeg: ".$e['total']." Ft\nFizetési állapot: ".(['PAID'=>'Fizetve','UNPAID'=>'Fizetésre vár','FAILED'=>'Sikertelen fizetés','RESERVED'=>'Fizetés nélkül rögzítve'][$e['payment_status']]??'Feldolgozás alatt')."\n";
        if($event==='order_created') $text.="A rendelés rögzítése nem igazolja a sikeres fizetést. A fizetésről külön értesítést küldünk.\n";
        if($event==='payment_success') $text.="A SimplePay visszaigazolta a fizetést. A csomag feladásáról külön értesítést küldünk.\n";
        if($event==='payment_failed') $text.="A rendelésed megmaradt. A fizetés folytatásához kérd ügyfélszolgálatunk segítségét.\n";
        if($event==='cancelled'&&$e['payment_status']==='PAID') $text.="A visszatérítést ügyfélszolgálatunkkal kell egyeztetni; a törlés nem indít automatikus visszatérítést.\n";
        if($event==='shipped') $text.="Nyomkövetés: ".implode(' ',array_filter($e['tracking']??[]))."\n";
        $text.="\n".rtrim((string)cfg('PUBLIC_SITE_URL'),'/').(str_starts_with($event,'admin_')?'/admin?order=':'/order/').$id;
    }
    $text.="\n\nÜgyfélszolgálat: ".cfg('SUPPORT_EMAIL');
    $html=mail_design($title,$text,$event,$e);
    return [$title." – H'INFINI #".$id,$html,$text];
}
function mail_escape(string $value): string { return htmlspecialchars($value,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8'); }
function mail_link(string $value): string {
    return filter_var($value,FILTER_VALIDATE_URL)&&in_array(strtolower((string)parse_url($value,PHP_URL_SCHEME)),['https','http'],true)?$value:'';
}
function mail_design(string $title,string $text,string $event,array $entity): string {
    $site=rtrim((string)cfg('PUBLIC_SITE_URL'),'/');
    $logo=mail_link($site.'/hinfini-logo.png');
    $products='';
    foreach($entity['items']??[] as $item) {
        $line=$item['name'].' × '.$item['quantity'].' — '.number_format($item['line_total'],0,',',' ')." Ft\n";
        $text=str_replace($line,'',$text);
        $photo=mail_link((string)($item['image']??''));
        $image=$photo!==''?'<img src="'.mail_escape($photo).'" alt="'.mail_escape($item['name']).'" width="64" height="64" style="display:block;width:64px;height:64px;object-fit:cover;border-radius:8px">':'';
        $products.='<tr><td width="76" style="padding:14px 0;border-bottom:1px solid #3d3835;vertical-align:top">'.$image.'</td><td style="padding:14px 8px;border-bottom:1px solid #3d3835;color:#F0EAD6;font:16px Arial">'.mail_escape($item['name']).'<br><span style="font-size:14px;color:#B8AE95">'.(int)$item['quantity'].' db · '.number_format($item['price'],0,',',' ').' Ft / db</span></td><td align="right" style="padding:14px 0;border-bottom:1px solid #3d3835;color:#D4AF6E;font:16px Arial">'.number_format($item['line_total'],0,',',' ').' Ft</td></tr>';
    }
    $invoice= $event==='invoice_ready'?mail_link((string)($entity['invoice']['url']??'')):'';
    $button=$invoice!==''?'<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0"><tr><td bgcolor="#D4AF6E" style="border-radius:24px;padding:14px 24px"><a href="'.mail_escape($invoice).'" style="font:bold 16px Arial;color:#1A1917;text-decoration:none">Számla megnyitása</a></td></tr></table>':'';
    $intro=$title." – H'INFINI #".($entity['order_id']??$entity['product_id'])."\n\n";
    if(str_starts_with($text,$intro))$text=substr($text,strlen($intro));
    return '<!doctype html><html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#0F0E0C"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#0F0E0C"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" bgcolor="#1A1917" style="width:100%;max-width:600px;border:1px solid #3d3835"><tr><td align="center" style="padding:32px 24px;border-bottom:1px solid #3d3835">'.($logo!==''?'<img src="'.mail_escape($logo).'" alt="H’INFINI Candles" width="88" height="88" style="display:block;border-radius:50%;margin-bottom:16px">':'').'<div style="color:#D4AF6E;font:28px Georgia,serif">H’INFINI</div><div style="color:#B8AE95;font:12px Arial;letter-spacing:3px;margin-top:8px">KÉZZEL ÖNTÖTT GYERTYÁK</div></td></tr><tr><td style="padding:28px 24px"><h1 style="margin:0 0 24px;color:#D4AF6E;font:30px Georgia,serif">'.mail_escape($title).'</h1><p style="color:#B8AE95;font:14px Arial;overflow-wrap:anywhere">Azonosító: '.mail_escape((string)($entity['order_id']??$entity['product_id'])).'</p>'.($products!==''?'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px">'.$products.'</table>':'').'<div style="color:#F0EAD6;font:16px/1.7 Arial;overflow-wrap:anywhere">'.nl2br(mail_escape($text)).'</div>'.$button.'</td></tr><tr><td align="center" style="padding:20px 24px;color:#B8AE95;border-top:1px solid #3d3835;font:13px/1.6 Arial">Kis szériás gyertyák · Személyes figyelemmel<br>H’INFINI Candles</td></tr></table></td></tr></table></body></html>';
}
function queue_event(string $event,array $entity,?string $to=null,bool $force=false,string $suffix=''): ?array {
    $recipient=$to??(str_starts_with($event,'admin_')?(string)cfg('ORDER_NOTIFY_EMAIL'):($entity['email']??''));
    if($recipient==='') return null;
    $idem=hash('sha256',$event.':'.($entity['order_id']??$entity['product_id']).':'.$recipient.$suffix.($force?':'.uid('retry'):''));
    [$subject,$html,$text]=mail_template($event,$entity);
    $d=['log_id'=>uid('eml'),'order_id'=>$entity['order_id']??null,'event'=>$event,'recipient'=>$recipient,'subject'=>$subject,
        'status'=>cfg('EMAIL_PROVIDER','none')==='none'?'SKIPPED':'QUEUED','provider'=>cfg('EMAIL_PROVIDER','none'),
        'provider_id'=>null,'error'=>null,'idempotency_key'=>$idem,'resend'=>$force,'created_at'=>now(),'html_body'=>$html,'text_body'=>$text];
    try { save('email_logs',$d,true); } catch(PDOException $e) { if((int)($e->errorInfo[1]??0)!==1062) throw $e; return null; }
    return $d;
}
function mail_public(array $d): array { unset($d['html_body'],$d['text_body']); return $d; }
function mail_worker(int $limit=50): int {
    $processed=0;
    while($processed<$limit) {
        $log=tx(function() {
            $r=sql("SELECT document FROM email_logs WHERE status='QUEUED' ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED")->fetchColumn();
            if($r===false) return null;
            $d=json_decode($r,true,512,JSON_THROW_ON_ERROR); $d['status']='SENDING'; $d['started_at']=now(); save('email_logs',$d); return $d;
        });
        if(!$log) break;
        try {
            $p=(string)cfg('EMAIL_PROVIDER','none');
            if($p==='none') $log['status']='SKIPPED';
            else {
                if(!cfg('EMAIL_FROM')) throw new RuntimeException('EMAIL_FROM is missing');
                if($p==='resend') {
                    $payload=['from'=>cfg('EMAIL_FROM_NAME',"H'INFINI Candles").' <'.cfg('EMAIL_FROM').'>','to'=>[$log['recipient']],'subject'=>$log['subject'],'html'=>$log['html_body'],'text'=>$log['text_body']];
                    if(cfg('EMAIL_REPLY_TO')) $payload['reply_to']=cfg('EMAIL_REPLY_TO');
                    $r=http_request('https://api.resend.com/emails',json($payload),['Content-Type: application/json','Authorization: Bearer '.cfg('RESEND_API_KEY'),'Idempotency-Key: '.$log['idempotency_key']]);
                } elseif($p==='php_mail') {
                    $from=(string)cfg('EMAIL_FROM');$reply=(string)cfg('EMAIL_REPLY_TO')?:$from;
                    if(!filter_var($from,FILTER_VALIDATE_EMAIL)||!filter_var($reply,FILTER_VALIDATE_EMAIL)||!filter_var($log['recipient'],FILTER_VALIDATE_EMAIL))throw new RuntimeException('Invalid email address');
                    $ok=mail($log['recipient'],'=?UTF-8?B?'.base64_encode($log['subject']).'?=',$log['html_body'],['From'=>$from,'Reply-To'=>$reply,'MIME-Version'=>'1.0','Content-Type'=>'text/html; charset=UTF-8']);
                    if(!$ok)throw new RuntimeException('A tárhely nem fogadta el a levelet.');
                    $r=['status'=>202,'body'=>'{}','headers'=>[]];
                } elseif($p==='sendgrid') {
                    $payload=['personalizations'=>[['to'=>[['email'=>$log['recipient']]]]],'from'=>['email'=>cfg('EMAIL_FROM'),'name'=>cfg('EMAIL_FROM_NAME',"H'INFINI Candles")],
                        'subject'=>$log['subject'],'content'=>[['type'=>'text/plain','value'=>$log['text_body']],['type'=>'text/html','value'=>$log['html_body']]]];
                    if(cfg('EMAIL_REPLY_TO')) $payload['reply_to']=['email'=>cfg('EMAIL_REPLY_TO')];
                    $r=http_request('https://api.sendgrid.com/v3/mail/send',json($payload),['Content-Type: application/json','Authorization: Bearer '.cfg('SENDGRID_API_KEY')]);
                } else throw new RuntimeException('Unknown email provider');
                if($r['status']<200||$r['status']>=300) throw new RuntimeException('Email provider HTTP '.$r['status']);
                $log['status']='SENT'; $log['provider_id']=json_decode($r['body'],true)['id']??$r['headers']['x-message-id']??null;
            }
        } catch(Throwable $e) { $log['status']='FAILED'; $log['error']=$e->getMessage(); }
        $log['completed_at']=now(); save('email_logs',$log); $processed++;
    }
    return $processed;
}
