<?php
declare(strict_types=1);
function order_create(array $b): array {
    if(!boolean($b,'accepted_terms')) fail(400,'terms_required');
    $o=['email'=>email_value($b)];
    $code=text_field($b,'coupon_code','',40);
    foreach(['full_name','address','city','postal_code'] as $k) $o[$k]=required($b,$k);
    foreach(['phone','notes'] as $k) $o[$k]=isset($b[$k])?text_field($b,$k):null;
    $o['country']=text_field($b,'country','Magyarország'); $o['lang']=text_field($b,'lang','hu');
    $o['shipping_method']=text_field($b,'shipping_method','home');
    if($o['shipping_method']!=='home') fail(400,'pickup_not_available');
    $o['newsletter_opt_in']=boolean($b,'newsletter_opt_in');
    $items=$b['items']??[];
    if(!is_array($items)||!array_is_list($items)||!count($items)||count($items)>100) fail(400,'cart_empty_or_too_large');
    $qty=[];
    foreach($items as $i) {
        if(!is_array($i)) fail(422,'invalid_item');
        $id=required($i,'product_id',80); $qty[$id]=($qty[$id]??0)+integer($i['quantity']??null,'quantity',1,10000);
        if($qty[$id]>10000) fail(422,'invalid_quantity');
    }
    ksort($qty); // All concurrent checkouts lock products in a stable order.
    return tx(function() use($o,$qty,$code) {
        $subtotal=0; $lines=[]; $low=[];
        foreach($qty as $id=>$count) {
            $p=need('products',$id,true);
            if(($p['status']??'published')!=='published') fail(400,'unavailable:'.$id);
            if($p['stock']<$count) fail(400,'out_of_stock:'.$p['name']);
            $line=['product_id'=>$id,'slug'=>$p['slug'],'name'=>$p['name'],'name_en'=>$p['name_en']??'','price'=>$p['price'],'image'=>$p['image']??'','quantity'=>$count,'line_total'=>$p['price']*$count];
            $subtotal+=$line['line_total']; if($subtotal>1000000000) fail(400,'order_too_large'); $lines[]=$line;
            $p['stock']-=$count; save('products',$p);
            if($p['stock']<=(int)cfg('LOW_STOCK_THRESHOLD',5)) $low[]=$p;
        }
        $shipping=$subtotal>=(int)cfg('FREE_SHIPPING_FROM',25000)?0:(int)cfg('SHIPPING_FEE_HOME',1990);
        $discount=coupon_discount($code,$subtotal,true);if($subtotal-$discount['discount']+$shipping<=0)fail(400,'A kuponnal a fizetendő összegnek pozitívnak kell maradnia.');$o+=$discount;
        $o+=['order_id'=>uid('ord'),'items'=>$lines,'subtotal'=>$subtotal,'shipping'=>$shipping,'total'=>$subtotal-$discount['discount']+$shipping,'accepted_terms_at'=>now(),
            'status'=>'PENDING','payment_status'=>'UNPAID','fulfillment_status'=>'AWAITING_PAYMENT','invoice'=>['status'=>'NONE'],
            'history'=>[['at'=>now(),'event'=>'created']],'created_at'=>now(),'stock_released'=>false];
        save('orders',$o,true);
        if($o['newsletter_opt_in']) subscribe(['email'=>$o['email'],'consent'=>true,'lang'=>$o['lang'],'source'=>'checkout']);
        queue_event('order_created',$o); queue_event('admin_new_order',$o);
        foreach($low as $p) queue_event('admin_low_stock',$p,null,false,':'.$p['stock']);
        return ['order_id'=>$o['order_id'],'total'=>$o['total'],'status'=>'PENDING'];
    });
}
function public_order(array $o): array {
    // Guest URLs are unguessable bearer references. Never expose addresses or admin data.
    return array_intersect_key($o,array_flip(['order_id','items','subtotal','discount','coupon_code','shipping','total','status','payment_status','fulfillment_status','shipping_method','created_at']));
}
function invoice_check(array &$o,string $trigger): void {
    if($trigger!==cfg('INVOICE_TRIGGER','paid')||in_array($o['invoice']['status']??'', ['ISSUED','MANUAL','PENDING_PROVIDER'],true)) return;
    $o['invoice']=['status'=>cfg('INVOICE_PROVIDER','none')==='none'?'NOT_CONFIGURED':'PENDING_PROVIDER','provider'=>cfg('INVOICE_PROVIDER','none'),
        'number'=>null,'url'=>null,'issued_at'=>null,'trigger'=>$trigger,'checked_at'=>now(),'error'=>'Automatikus számlázó nincs bekötve; állítsd ki és rögzítsd kézzel a számlát.'];
}
function order_status(string $id,array $b): array {
    $next=required($b,'fulfillment_status');
    if(!in_array($next,['NEW','AWAITING_PAYMENT','PAID','PACKING','SHIPPED','COMPLETED','CANCELLED'],true)) fail(400,'invalid_status');
    return tx(function() use($id,$b,$next) {
        $o=need('orders',$id,true); $prev=$o['fulfillment_status'];
        if($prev==='CANCELLED'&&$next!=='CANCELLED') fail(409,'cancelled_order_cannot_reopen');
        if(in_array($next,['PAID','PACKING','SHIPPED','COMPLETED'],true)&&$o['payment_status']!=='PAID') fail(409,'payment_not_confirmed');
        if($next==='CANCELLED'&&empty($o['stock_released'])) {
            $lines=$o['items']; usort($lines,fn($a,$b)=>strcmp($a['product_id'],$b['product_id']));
            foreach($lines as $li) { $p=one('products',$li['product_id'],true); if($p) { $p['stock']+=$li['quantity']; save('products',$p); } }
            if(!empty($o['coupon_code'])){$c=one('coupons',$o['coupon_code'],true);if($c){$c['used']=max(0,$c['used']-1);save('coupons',$c);}}
            $o['stock_released']=true;
        }
        $o['fulfillment_status']=$next; $o['updated_at']=now();
        if($next!==$prev) $o['history'][]=['at'=>now(),'event'=>'admin:'.$prev.'->'.$next];
        if(isset($b['admin_note'])) $o['admin_note']=text_field($b,'admin_note');
        if($next==='SHIPPED') {
            $o['tracking']=[]; foreach(['carrier','number','url','eta'] as $key) $o['tracking'][$key]=text_field($b,'tracking_'.$key);
            web_url($o['tracking']['url']); $o['shipped_at']=now();
            if($prev!==$next) queue_event('shipped',$o);
        }
        if($next==='CANCELLED'&&$prev!==$next) { queue_event('cancelled',$o); queue_event('admin_cancel_request',$o); }
        if($next==='COMPLETED') invoice_check($o,'fulfilled');
        save('orders',$o); return ['ok'=>true];
    });
}
