<?php
declare(strict_types=1);
function route(string $method,string $path,array $b): mixed {
    $admin=str_starts_with($path,'/admin/'); if($admin) admin_auth();
    $studio=studio_route($method,$path,$b);if($studio!==null)return $studio;
    if($method==='GET'&&$path==='/') return ['message'=>"H'INFINI Candles PHP API",'status'=>'ok'];
    if($method==='GET'&&$path==='/config') return ['free_shipping_from'=>(int)cfg('FREE_SHIPPING_FROM',25000),'shipping_home'=>(int)cfg('SHIPPING_FEE_HOME',1990),
        'shipping_pickup'=>(int)cfg('SHIPPING_FEE_PICKUP',1290),'payment_mode'=>str_contains((string)cfg('SIMPLEPAY_BASE_URL','https://sandbox.simplepay.hu/payment/v2'),'sandbox')?'sandbox':'live','support_email'=>cfg('SUPPORT_EMAIL')];
    if($method==='GET'&&str_starts_with($path,'/uploads/')) serve_upload(substr($path,9));
    if($method==='GET'&&$path==='/products') return products_list();
    if($method==='GET'&&$path==='/products/random') { $p=rows('products',"status='published'"); shuffle($p); return array_map('public_product',array_slice($p,0,max(0,min(1000,(int)($_GET['limit']??100))))); }
    if($method==='GET'&&preg_match('~^/products/([^/]+)$~',$path,$m)) {
        $p=rows('products',"slug=? AND status='published'",[$m[1]])[0]??fail(404,'Not found');
        $related=rows('products',"category=? AND slug<>? AND status='published'",[$p['category'],$p['slug']]); shuffle($related);
        $p=public_product($p); $p['related']=array_map('public_product',array_slice($related,0,4)); return $p;
    }
    if($method==='GET'&&$path==='/categories') return category_list();
    if($method==='GET'&&$path==='/guides') return [];
    if($method==='GET'&&preg_match('~^/guides/([^/]+)$~',$path,$m)) fail(404,'Not found');
    if($method==='POST'&&$path==='/newsletter/subscribe') return subscribe($b);
    if($method==='POST'&&$path==='/orders') return order_create($b);
    if($method==='GET'&&preg_match('~^/orders/([^/]+)$~',$path,$m)) return public_order(need('orders',$m[1]));
    if($method==='POST'&&$path==='/payments/start') return payment_start($b);
    if($method==='POST'&&$path==='/payments/return') return payment_return($b);
    if($method==='POST'&&$path==='/admin/verify') return ['ok'=>true];
    if($method==='GET'&&$path==='/admin/stats') return [
        'products'=>(int)sql("SELECT COUNT(*) FROM products WHERE status<>'archived'")->fetchColumn(),
        'orders_new'=>(int)sql("SELECT COUNT(*) FROM orders WHERE fulfillment_status IN ('NEW','AWAITING_PAYMENT','PAID')")->fetchColumn(),
        'low_stock'=>(int)sql("SELECT COUNT(*) FROM products WHERE status<>'archived' AND stock<=?",[(int)cfg('LOW_STOCK_THRESHOLD',5)])->fetchColumn(),
        'subscribers'=>(int)sql('SELECT COUNT(*) FROM newsletter')->fetchColumn(),'email_provider'=>cfg('EMAIL_PROVIDER','none'),'storage'=>cfg('STORAGE_DRIVER','local'),
        'payment_mode'=>str_contains((string)cfg('SIMPLEPAY_BASE_URL','sandbox'),'sandbox')?'sandbox':'live'];
    if($method==='GET'&&$path==='/admin/products') return array_map('public_product',rows('products',filter_var($_GET['include_archived']??false,FILTER_VALIDATE_BOOLEAN)?'1':"status<>'archived'"));
    if($method==='POST'&&$path==='/admin/products') { $p=product_input($b)+['product_id'=>uid('prd'),'created_at'=>now(),'updated_at'=>now()]; save('products',$p,true); return $p; }
    if($method==='PUT'&&preg_match('~^/admin/products/([^/]+)$~',$path,$m)) return tx(function() use($m,$b) {
        $p=need('products',$m[1],true); $p=array_replace($p,product_input($b),['updated_at'=>now()]); save('products',$p); return ['ok'=>true];
    });
    if($method==='POST'&&preg_match('~^/admin/products/([^/]+)/archive$~',$path,$m)) return tx(function() use($m) {
        $p=need('products',$m[1],true); $p['status']='archived'; $p['updated_at']=now(); save('products',$p); return ['ok'=>true];
    });
    if($method==='POST'&&$path==='/admin/products/bulk') return tx(function() use($b) {
        $ids=$b['product_ids']??[]; if(!is_array($ids)||count($ids)>2000) fail(422,'invalid_product_ids');
        foreach($ids as $id) if(!is_string($id)) fail(422,'invalid_product_ids');
        $action=required($b,'action'); $map=['publish'=>'published','hide'=>'hidden','archive'=>'archived'];
        if($action==='set_category') $category=need('categories',required($b,'category'))['name']; elseif(!isset($map[$action])) fail(400,'invalid_action');
        $ids=array_unique($ids); sort($ids); $count=0;
        foreach($ids as $id) { $p=one('products',$id,true); if(!$p) continue; if($action==='set_category') $p['category']=$category; else $p['status']=$map[$action]; $p['updated_at']=now(); save('products',$p); $count++; }
        return ['ok'=>true,'modified'=>$count];
    });
    if($method==='GET'&&$path==='/admin/categories') return category_list(true);
    if($method==='POST'&&$path==='/admin/categories') { $c=category_input($b); if($c['order']===0) $c['order']=(int)sql('SELECT COUNT(*) FROM categories')->fetchColumn()+1; save('categories',$c,true); return $c+['count'=>0]; }
    if($method==='PUT'&&preg_match('~^/admin/categories/([^/]+)$~',$path,$m)) return tx(function() use($m,$b) {
        need('categories',$m[1],true); $c=category_input($b);
        if($c['name']!==$m[1]) {
            // SQL FK updates category columns; update the corresponding JSON documents too.
            sql('UPDATE categories SET name=? WHERE name=?',[$c['name'],$m[1]]);
            foreach(rows('products','category=?',[$c['name']]) as $old) { $p=need('products',$old['product_id'],true); $p['category']=$c['name']; save('products',$p); }
        }
        save('categories',$c); return ['ok'=>true];
    });
    if($method==='POST'&&$path==='/admin/categories/reorder') return tx(function() use($b) {
        $names=$b['names']??null; if(!is_array($names)||count($names)>200) fail(422,'invalid_names');
        foreach($names as $i=>$n) { if(!is_string($n)) fail(422,'invalid_names'); $c=need('categories',$n,true); $c['order']=$i+1; save('categories',$c); } return ['ok'=>true];
    });
    if($method==='DELETE'&&preg_match('~^/admin/categories/([^/]+)$~',$path,$m)) return tx(function() use($m) {
        need('categories',$m[1],true); if((int)sql('SELECT COUNT(*) FROM products WHERE category=?',[$m[1]])->fetchColumn()) fail(400,'category_in_use'); remove('categories',$m[1]); return ['ok'=>true];
    });
    if($method==='GET'&&$path==='/admin/media') return array_reverse(rows('media'));
    if($method==='POST'&&$path==='/admin/media/upload') return media_upload();
    if($method==='PATCH'&&preg_match('~^/admin/media/([^/]+)$~',$path,$m)) return tx(function() use($m,$b) { $d=need('media',$m[1],true); $d['alt']=text_field($b,'alt'); save('media',$d); return ['ok'=>true]; });
    if($method==='DELETE'&&preg_match('~^/admin/media/([^/]+)$~',$path,$m)) return media_delete($m[1]);
    if($method==='GET'&&$path==='/admin/orders') {
        $items=rows('orders',empty($_GET['status'])?'1':'fulfillment_status=?',empty($_GET['status'])?[]:[(string)$_GET['status']],'created_at DESC');
        if(!empty($_GET['q'])) { $q=mb_strtolower((string)$_GET['q']); $items=array_values(array_filter($items,fn($o)=>str_contains(mb_strtolower($o['order_id'].' '.$o['email'].' '.$o['full_name']),$q))); }
        return array_map(function($o) { unset($o['ipn'],$o['simplepay_response']); return $o; },$items);
    }
    if($method==='GET'&&preg_match('~^/admin/orders/([^/]+)$~',$path,$m)) {
        $o=need('orders',$m[1]); unset($o['ipn'],$o['simplepay_response']); $o['emails']=array_map('mail_public',rows('email_logs','order_id=?',[$m[1]],'created_at DESC')); return $o;
    }
    if($method==='PATCH'&&preg_match('~^/admin/orders/([^/]+)/status$~',$path,$m)) return order_status($m[1],$b);
    if($method==='PATCH'&&preg_match('~^/admin/orders/([^/]+)/invoice$~',$path,$m)) return tx(function() use($m,$b) {
        $o=need('orders',$m[1],true); $status=required($b,'status'); if(!in_array($status,['NONE','NOT_CONFIGURED','PENDING_PROVIDER','PENDING','ISSUED','MANUAL','ERROR','CANCELLED'],true)) fail(422,'invalid_invoice_status');
        $o['invoice']=['status'=>$status,'number'=>text_field($b,'number'),'url'=>web_url(text_field($b,'url')),'provider'=>'manual','issued_at'=>now()]; save('orders',$o); return ['ok'=>true];
    });
    if($method==='POST'&&preg_match('~^/admin/orders/([^/]+)/invoice/send$~',$path,$m)) return tx(function()use($m){$o=need('orders',$m[1],true);if(empty($o['invoice']['number'])||empty($o['invoice']['url']))fail(422,'Előbb add meg a számlaszámot és a számla letöltési címét.');if(cfg('EMAIL_PROVIDER','none')==='none')fail(422,'Az e-mail-küldés nincs beállítva.');queue_event('invoice_ready',$o,null,false,':'.$o['invoice']['number']);return ['ok'=>true];});
    if($method==='GET'&&$path==='/admin/newsletter') return array_reverse(rows('newsletter'));
    if($method==='DELETE'&&preg_match('~^/admin/newsletter/(.+)$~',$path,$m)) { remove('newsletter',strtolower($m[1])); return ['ok'=>true]; }
    if($method==='GET'&&$path==='/admin/emails') return array_map('mail_public',rows('email_logs',empty($_GET['order_id'])?'1':'order_id=?',empty($_GET['order_id'])?[]:[(string)$_GET['order_id']],'created_at DESC'));
    if($method==='POST'&&preg_match('~^/admin/emails/([^/]+)/resend$~',$path,$m)) {
        $log=need('email_logs',$m[1]); if($log['event']==='admin_low_stock') fail(400,'not_resendable');
        $o=str_starts_with($log['order_id']??'','custom_')?custom_mail_entity(need('custom_requests',$log['order_id'])):need('orders',$log['order_id']); return mail_public(queue_event($log['event'],$o,$log['recipient'],true)??['ok'=>false]);
    }
    fail(404,'Not found');
}
