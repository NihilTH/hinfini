<?php
declare(strict_types=1);
function invoice_key(string $mode): string { return (string)cfg($mode==='live'?'SZAMLAZZ_AGENT_KEY':'SZAMLAZZ_TEST_AGENT_KEY'); }
function invoice_ready_config(string $mode): bool {
    return cfg('INVOICE_PROVIDER','none')==='szamlazz'&&filter_var(cfg('SZAMLAZZ_ENABLED',false),FILTER_VALIDATE_BOOLEAN)&&invoice_key($mode)!==''&&cfg('INVOICE_VAT','AAM')==='AAM';
}
function invoice_xml(array $o,string $key): string {
    if($o['payment_status']!=='PAID'||cfg('INVOICE_VAT','AAM')!=='AAM')throw new RuntimeException('Csak fizetett, AAM rendelés számlázható ezzel a beállítással.');
    $x=fn($v)=>htmlspecialchars((string)$v,ENT_XML1|ENT_QUOTES,'UTF-8');
    $tag=fn($k,$v)=>'<'.$k.'>'.$x($v).'</'.$k.'>';
    $date=(new DateTimeImmutable($o['paid_at']))->setTimezone(new DateTimeZone('Europe/Budapest'))->format('Y-m-d');
    $today=(new DateTimeImmutable('now',new DateTimeZone('Europe/Budapest')))->format('Y-m-d');
    $settings=$tag('szamlaagentkulcs',$key).$tag('eszamla',filter_var(cfg('SZAMLAZZ_E_INVOICE',false),FILTER_VALIDATE_BOOLEAN)?'true':'false').$tag('szamlaLetoltes','true').$tag('valaszVerzio',1).$tag('szamlaKulsoAzon',$o['order_id']);
    $header=$tag('keltDatum',$today).$tag('teljesitesDatum',$date).$tag('fizetesiHataridoDatum',$date).$tag('fizmod','Bankkártya').$tag('penznem','HUF').$tag('szamlaNyelve',($o['lang']??'hu')==='en'?'en':'hu').$tag('megjegyzes','Barion: '.($o['transaction_id']??'')).$tag('rendelesSzam',$o['order_id']).$tag('szamlaszamElotag',cfg('SZAMLAZZ_PREFIX')).$tag('fizetve','true');
    $billing=$o['billing']??$o;
    $buyer=$tag('nev',$billing['full_name']).$tag('orszag','Magyarország').$tag('irsz',$billing['postal_code']).$tag('telepules',$billing['city']).$tag('cim',$billing['address']).$tag('email',$o['email']).$tag('sendEmail','false').$tag('adoalany',empty($billing['tax_number'])?-1:1);
    if(!empty($billing['tax_number']))$buyer.=$tag('adoszam',$billing['tax_number']);
    $lines='';$sum=0;
    $line=function(string $name,int $qty,int $unit)use($tag,&$sum){$total=$qty*$unit;$sum+=$total;return '<tetel>'.$tag('megnevezes',$name).$tag('mennyiseg',$qty).$tag('mennyisegiEgyseg','db').$tag('nettoEgysegar',$unit).$tag('afakulcs','AAM').$tag('nettoErtek',$total).$tag('afaErtek',0).$tag('bruttoErtek',$total).'</tetel>';};
    foreach($o['items'] as $i)$lines.=$line($i['name'].(!empty($i['color'])?' · '.$i['color']:''),(int)$i['quantity'],(int)$i['price']);
    if(!empty($o['discount']))$lines.=$line('Kuponkedvezmény: '.($o['coupon_code']??''),1,-(int)$o['discount']);
    if(!empty($o['shipping']))$lines.=$line('Szállítás',1,(int)$o['shipping']);
    if($sum!==(int)$o['total'])throw new RuntimeException('A számlatételek összege eltér a rendeléstől.');
    return '<?xml version="1.0" encoding="UTF-8"?><xmlszamla xmlns="http://www.szamlazz.hu/xmlszamla"><beallitasok>'.$settings.'</beallitasok><fejlec>'.$header.'</fejlec><elado/><vevo>'.$buyer.'</vevo><tetelek>'.$lines.'</tetelek></xmlszamla>';
}
function invoice_request(string $xml): array {
    $boundary='hinfini'.bin2hex(random_bytes(16));
    $body='--'.$boundary."\r\nContent-Disposition: form-data; name=\"action-xmlagentxmlfile\"; filename=\"invoice.xml\"\r\nContent-Type: text/xml; charset=UTF-8\r\n\r\n".$xml."\r\n--".$boundary."--\r\n";
    return http_request('https://www.szamlazz.hu/szamla/',$body,['Content-Type: multipart/form-data; boundary='.$boundary]);
}
function invoice_result(array $r,array $o): array {
    $number=urldecode((string)($r['headers']['szlahu_szamlaszam']??''));
    if($r['status']!==200||!empty($r['headers']['szlahu_error_code'])||$number===''||!str_starts_with($r['body'],'%PDF-')||!isset($r['headers']['szlahu_bruttovegosszeg'])||(float)$r['headers']['szlahu_bruttovegosszeg']!==(float)$o['total'])throw new RuntimeException('Számlázz.hu válasz ellenőrzése sikertelen. Ellenőrizd a számlázási fiókot; automatikus ismétlés nem történt.');
    return ['number'=>$number,'pdf'=>$r['body']];
}
function invoice_path(string $id): string { if(!preg_match('/^ord_[a-f0-9]{32}$/',$id))fail(404,'Not found');return dirname(__DIR__).'/private-invoices/'.$id.'.pdf'; }
function invoice_store(array $o,array $result): array {
    $path=invoice_path($o['order_id']);$dir=dirname($path);
    if(!is_dir($dir)&&!mkdir($dir,0700,true)&&!is_dir($dir))throw new RuntimeException('A privát számlamappa nem írható.');
    $temp=tempnam($dir,'pdf-');if($temp===false)throw new RuntimeException('Számlafájl mentési hiba.');
    try{if(file_put_contents($temp,$result['pdf'],LOCK_EX)===false)throw new RuntimeException('Számlafájl mentési hiba.');chmod($temp,0600);if(!rename($temp,$path))throw new RuntimeException('Számlafájl mentési hiba.');}finally{if(is_file($temp))unlink($temp);}
    $token=bin2hex(random_bytes(32));
    return ['status'=>'ISSUED','provider'=>'szamlazz','number'=>$result['number'],'issued_at'=>now(),'environment'=>$o['payment_environment'],'download_hash'=>hash('sha256',$token),
        'url'=>rtrim((string)cfg('PUBLIC_SITE_URL'),'/').'/api/invoices/'.$o['order_id'].'/'.$token,'error'=>null];
}
function invoice_worker(int $limit=10, ?callable $transport=null): int {
    $transport??='invoice_request';
    $count=0;
    foreach(rows('orders',"payment_status='PAID'",[],'created_at') as $candidate){
        if($count>=$limit)break;
        $mode=$candidate['payment_environment']??'live';
        if(!invoice_ready_config($mode)||($candidate['invoice']['status']??'')!=='QUEUED')continue;
        $o=tx(function()use($candidate){$o=need('orders',$candidate['order_id'],true);if(($o['invoice']['status']??'')!=='QUEUED')return null;
            if($o['fulfillment_status']==='CANCELLED'||!empty($o['payment_review_required'])){$o['invoice']['status']='REVIEW';$o['invoice']['error']='Törölt vagy ellenőrizendő rendelés; kézi egyeztetés szükséges.';save('orders',$o);return null;}
            $o['invoice']['status']='PROCESSING';$o['invoice']['started_at']=now();save('orders',$o);return $o;});
        if(!$o)continue;
        // Commit the claim before calling a provider. A timeout/crash must never create a second invoice.
        try{
            $result=invoice_result($transport(invoice_xml($o,invoice_key($mode))),$o);
            $invoice=invoice_store($o,$result);
            tx(function()use($o,$invoice){$current=need('orders',$o['order_id'],true);$current['invoice']=$invoice;save('orders',$current);queue_event('invoice_ready',$current);});
        }catch(Throwable $e){tx(function()use($o){$current=need('orders',$o['order_id'],true);$current['invoice']['status']='REVIEW';$current['invoice']['error']='A számla eredménye ellenőrzést igényel. Nézd meg a Számlázz.hu fiókban a rendelésazonosítót; ne állíts ki újabb számlát ellenőrzés nélkül.';save('orders',$current);});}
        $count++;
    }return $count;
}
function invoice_download(string $id,string $token): never {
    $o=need('orders',$id);$hash=$o['invoice']['download_hash']??'';
    if($hash===''||!hash_equals($hash,hash('sha256',$token)))fail(404,'Not found');
    $path=invoice_path($id);if(!is_file($path))fail(404,'Not found');
    header('Content-Type: application/pdf');header('Content-Disposition: attachment; filename="hinfini-szamla.pdf"');header('Cache-Control: private, no-store');header('Referrer-Policy: no-referrer');header('X-Content-Type-Options: nosniff');readfile($path);exit;
}
