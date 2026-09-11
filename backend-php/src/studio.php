<?php
declare(strict_types=1);
function studio_settings(): array { return one('settings','studio')??['key'=>'studio','scents'=>['Egyeztetést kérek'],'containers'=>['Egyeztetést kérek'],'colors'=>['Fekete','Fehér','Arany','Egyeztetést kérek']]; }
function option_list(array $b,string $key): array {
    $v=$b[$key]??null; if(!is_array($v)||!array_is_list($v)||count($v)<1||count($v)>50) fail(422,'invalid_options');
    foreach($v as $s) if(!is_string($s)||trim($s)===''||strlen($s)>150) fail(422,'invalid_options');
    return array_values(array_unique(array_map('trim',$v)));
}
function public_limit(string $scope,int $limit=10): void {
    $key=hash('sha256',$scope.':'.($_SERVER['REMOTE_ADDR']??'unknown'));
    $ok=tx(function() use($key,$limit) { sql('INSERT IGNORE INTO public_limits VALUES (?,0,?)',[$key,time()]);
        $r=sql('SELECT * FROM public_limits WHERE ip_hash=? FOR UPDATE',[$key])->fetch();
        if(time()-(int)$r['window_start']>=3600) { sql('UPDATE public_limits SET attempts=0,window_start=? WHERE ip_hash=?',[time(),$key]);$r['attempts']=0; }
        if((int)$r['attempts']>=$limit)return false;
        sql('UPDATE public_limits SET attempts=attempts+1 WHERE ip_hash=?',[$key]);return true;
    });if(!$ok)fail(429,'Túl sok kérés. Próbáld később.');
}
function coupon_input(array $b): array {
    $code=strtoupper(required($b,'code',40)); if(!preg_match('/^[A-Z0-9_-]{3,40}$/D',$code))fail(422,'Érvénytelen kuponkód.');
    $type=required($b,'type');if(!in_array($type,['percent','fixed'],true))fail(422,'Érvénytelen kedvezménytípus.');
    $d=['code'=>$code,'type'=>$type,'value'=>integer($b['value']??null,'value',1,$type==='percent'?100:1000000),
        'minimum'=>integer($b['minimum']??0,'minimum'),'limit'=>integer($b['limit']??0,'limit',0,1000000),'active'=>boolean($b,'active',true)];
    foreach(['starts_at','ends_at'] as $k) {$v=text_field($b,$k);if($v!==''&&strtotime($v)===false)fail(422,'Érvénytelen dátum.');$d[$k]=$v===''?'':gmdate('Y-m-d\TH:i:s\Z',strtotime($v));}
    if($d['starts_at']&&$d['ends_at']&&$d['starts_at']>=$d['ends_at'])fail(422,'A lejárat legyen a kezdő dátum után.');return $d;
}
function coupon_discount(string $code,int $subtotal,bool $reserve=false): array {
    $code=strtoupper(trim($code));if($code==='')return ['coupon_code'=>'','discount'=>0];
    $c=one('coupons',$code,$reserve);
    if(!$c||!$c['active']||($c['starts_at']&&$c['starts_at']>now())||($c['ends_at']&&$c['ends_at']<=now())||($c['limit']>0&&$c['used']>=$c['limit']))fail(400,'A kupon nem érvényes, lejárt vagy elfogyott.');
    if($subtotal<$c['minimum'])fail(400,'A kuponhoz legalább '.$c['minimum'].' Ft termékérték szükséges.');
    $discount=min($subtotal,$c['type']==='percent'?intdiv($subtotal*$c['value'],100):$c['value']);
    if($reserve){$c['used']++;save('coupons',$c);}return ['coupon_code'=>$code,'discount'=>$discount];
}
function coupon_preview(array $b): array {
    public_limit('coupon',120);$items=$b['items']??[];if(!is_array($items)||count($items)<1||count($items)>100)fail(422,'Üres kosár.');$sum=0;
    foreach($items as $i){if(!is_array($i))fail(422,'Hibás termék.');$p=need('products',required($i,'product_id',80));if($p['status']!=='published')fail(400,'A termék nem elérhető.');$sum+=$p['price']*integer($i['quantity']??null,'quantity',1,10000);if($sum>1000000000)fail(400,'Túl nagy rendelés.');}
    $d=coupon_discount(required($b,'code',40),$sum);$shipping=$sum>=(int)cfg('FREE_SHIPPING_FROM',25000)?0:(int)cfg('SHIPPING_FEE_HOME',1990);if($sum-$d['discount']+$shipping<=0)fail(400,'A kuponnal a fizetendő összegnek pozitívnak kell maradnia.');return $d+['subtotal'=>$sum,'shipping'=>$shipping,'total'=>$sum-$d['discount']+$shipping];
}
function custom_create(array $b): array {
    public_limit('custom',8);
    if(text_field($b,'website')!=='')fail(400,'Nem sikerült elküldeni.');
    if(($b['consent']??'')!=='1')fail(422,'Az adatkezelési hozzájárulás szükséges.');
    $s=studio_settings();$d=['request_id'=>uid('custom'),'full_name'=>required($b,'full_name'),'email'=>email_value($b),'phone'=>text_field($b,'phone','',80),'created_at'=>now(),'status'=>'NEW'];
    foreach(['scent'=>'scents','container'=>'containers'] as $key=>$options){$d[$key]=required($b,$key);if(!in_array($d[$key],$s[$options],true))fail(422,'Válassz az elérhető lehetőségek közül.');}
    $d['text']=text_field($b,'text','',1000);$d['idea']=text_field($b,'idea','',5000);$d['color']=text_field($b,'color');$d['consented_at']=now();$d['attachment']=null;
    $f=$_FILES['image']??null;$path=null;
    if($f&&$f['error']!==UPLOAD_ERR_NO_FILE){
        if($f['error']!==UPLOAD_ERR_OK||!is_uploaded_file($f['tmp_name'])||filesize($f['tmp_name'])>5*1024*1024)fail(422,'A kép legfeljebb 5 MB lehet.');
        $type=(new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);$ext=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'][$type]??null;$info=getimagesize($f['tmp_name']);
        if(!$ext||!$info||$info[0]*$info[1]>25000000)fail(422,'JPG, PNG vagy WebP képet válassz, legfeljebb 25 megapixellel.');
        $dir=dirname(__DIR__).'/custom_uploads';if(!is_dir($dir)&&!mkdir($dir,0700,true))throw new RuntimeException('Upload unavailable');
        $name=bin2hex(random_bytes(20)).'.'.$ext;$path=$dir.'/'.$name;
        if(!move_uploaded_file($f['tmp_name'],$path))throw new RuntimeException('Upload failed');chmod($path,0600);$d['attachment']=['file'=>$name,'type'=>$type];$d['color']='';
    }elseif($d['text']!==''&&!in_array($d['color'],$s['colors'],true))fail(422,'Válassz szövegszínt.');
    if($d['text']===''&&$d['idea']===''&&!$d['attachment'])fail(422,'Adj meg szöveget, képet vagy egyedi elképzelést.');
    try {tx(function()use($d){save('custom_requests',$d,true);queue_event('custom_received',custom_mail_entity($d));queue_event('admin_custom',custom_mail_entity($d));});}
    catch(Throwable $e){if($path)is_file($path)&&unlink($path);throw $e;}
    return ['request_id'=>$d['request_id'],'message'=>'Megkaptuk az ajánlatkérésedet. Az egyedi ajánlatot e-mailben küldjük; fizetni majd átutalással tudsz.'];
}
function custom_mail_entity(array $d): array {return $d+['order_id'=>$d['request_id']];}
function custom_quote(string $id,array $b): array {
    if(cfg('EMAIL_PROVIDER','none')==='none')fail(422,'Előbb állítsd be az e-mail-küldést.');
    foreach(['BANK_ACCOUNT_NAME','BANK_ACCOUNT_NUMBER'] as $k)if(!cfg($k))fail(422,'Előbb add meg az átutalási bankszámla adatait.');
    return tx(function()use($id,$b){$d=need('custom_requests',$id,true);if(in_array($d['status'],['PAID','CLOSED'],true))fail(409,'Lezárt vagy fizetett kérésre nem adható új ajánlat.');
        $d['quote']=['amount'=>integer($b['amount']??null,'amount',1,100000000),'message'=>required($b,'message',10000),'created_at'=>now(),'revision'=>($d['quote']['revision']??0)+1];
        $d['status']='QUOTED';save('custom_requests',$d);queue_event('custom_quote',custom_mail_entity($d),null,false,':'.$d['quote']['revision']);return $d;
    });
}
function studio_route(string $method,string $path,array $b): mixed {
    if($method==='GET'&&$path==='/studio')return studio_settings();
    if($method==='GET'&&$path==='/events')return rows('events','active=1',[],'starts_at ASC');
    if($method==='POST'&&$path==='/coupons/validate')return coupon_preview($b);
    if($method==='POST'&&$path==='/custom-requests')return custom_create($_POST);
    if($method==='GET'&&$path==='/admin/custom-requests')return rows('custom_requests','1',[],'created_at DESC');
    if($method==='POST'&&preg_match('~^/admin/custom-requests/([^/]+)/quote$~',$path,$m))return custom_quote($m[1],$b);
    if($method==='PATCH'&&preg_match('~^/admin/custom-requests/([^/]+)$~',$path,$m))return tx(function()use($m,$b){$d=need('custom_requests',$m[1],true);$state=required($b,'status');if(!in_array($state,['PAID','CLOSED'],true)||($state==='PAID'&&$d['status']!=='QUOTED'))fail(422,'Érvénytelen állapotváltás.');$d['status']=$state;$d['updated_at']=now();save('custom_requests',$d);return $d;});
    if($method==='GET'&&preg_match('~^/admin/custom-requests/([^/]+)/image$~',$path,$m)){
        $d=need('custom_requests',$m[1]);$a=$d['attachment']??null;if(!$a||!preg_match('/^[a-f0-9]{40}\.(jpg|png|webp)$/D',$a['file']))fail(404,'Nincs kép.');$p=dirname(__DIR__).'/custom_uploads/'.$a['file'];if(!is_file($p))fail(404,'Nincs kép.');header('Content-Type: '.$a['type']);header('Content-Disposition: attachment; filename="gyertyaterv.'.pathinfo($p,PATHINFO_EXTENSION).'"');header("Content-Security-Policy: default-src 'none'; sandbox");readfile($p);exit;
    }
    if($method==='GET'&&$path==='/admin/studio')return studio_settings();
    if($method==='PUT'&&$path==='/admin/studio'){$d=['key'=>'studio'];foreach(['scents','containers','colors'] as $k)$d[$k]=option_list($b,$k);$old=one('settings','studio');save('settings',$d,!$old);return $d;}
    if($method==='GET'&&$path==='/admin/coupons')return rows('coupons');
    if($method==='POST'&&$path==='/admin/coupons'){ $d=coupon_input($b)+['used'=>0];save('coupons',$d,true);return $d; }
    if($method==='PUT'&&preg_match('~^/admin/coupons/([^/]+)$~',$path,$m))return tx(function()use($b,$m){$old=need('coupons',$m[1],true);$d=coupon_input($b);if($d['code']!==$old['code'])fail(422,'A kuponkód nem módosítható.');$d['used']=$old['used'];save('coupons',$d);return $d;});
    if($method==='GET'&&$path==='/admin/events')return rows('events','1',[],'starts_at ASC');
    if(in_array($method,['POST','PUT'],true)&&preg_match('~^/admin/events(?:/([^/]+))?$~',$path,$m)){
        $d=['event_id'=>$m[1]??uid('evt'),'title'=>required($b,'title'),'location'=>required($b,'location'),'description'=>text_field($b,'description','',5000),'starts_at'=>required($b,'starts_at'),'active'=>boolean($b,'active',true)];if(strtotime($d['starts_at'])===false)fail(422,'Érvénytelen időpont.');$d['starts_at']=gmdate('Y-m-d\TH:i:s\Z',strtotime($d['starts_at']));if(isset($m[1]))need('events',$m[1]);save('events',$d,!isset($m[1]));return $d;
    }
    if($method==='DELETE'&&preg_match('~^/admin/events/([^/]+)$~',$path,$m)){remove('events',$m[1]);return ['ok'=>true];}
    return null;
}
