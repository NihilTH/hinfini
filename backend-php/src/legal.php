<?php
declare(strict_types=1);
function legal_text(string $lang='hu'): string {
    $d=json_decode(file_get_contents(dirname(__DIR__).'/database/legal.json'),true,512,JSON_THROW_ON_ERROR);
    $text="H'INFINI – ".$d['version']."\n";
    foreach(['aszf','elallas'] as $page)foreach($d['pages'][$page][$lang==='en'?'en':'hu'] as [$heading,$body])$text.="\n".$heading."\n".$body."\n";
    return str_replace(['{shipping_home}','{free_shipping_from}'],[(string)cfg('SHIPPING_FEE_HOME',1990),(string)cfg('FREE_SHIPPING_FROM',25000)],$text);
}
function withdrawal_create(array $b): array {
    public_limit('withdrawal',5);
    if(!boolean($b,'confirmed'))fail(422,'confirmation_required');
    $id=uid('withdrawal');$lang=text_field($b,'lang')==='en'?'en':'hu';
    $d=['key'=>$id,'order_id'=>$id,'full_name'=>required($b,'full_name',250),'email'=>email_value($b),'contract'=>required($b,'contract',500),'message'=>text_field($b,'message','',2000),'received_at'=>now(),'lang'=>$lang];
    $d['statement']=($lang==='hu'?'Elállok az alább azonosított szerződéstől.':'I withdraw from the contract identified below.')."\n".$d['full_name']."\n".$d['email']."\n".$d['contract']."\n".($d['message']?:($lang==='hu'?'Teljes rendelés':'Entire order'));
    tx(function()use($d){save('settings',$d,true);queue_event('withdrawal_received',$d);queue_event('admin_withdrawal',$d);});
    return ['reference'=>$id,'received_at'=>$d['received_at'],'statement'=>$d['statement']];
}
