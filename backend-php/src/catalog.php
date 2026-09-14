<?php
declare(strict_types=1);
function public_product(array $p): array {
    $stock=(int)($p['stock']??0); $p['stock_state']=$stock<=0?'out':($stock<=(int)cfg('LOW_STOCK_THRESHOLD',5)?'low':'in'); return $p;
}
function product_input(array $b): array {
    $p=[];
    foreach (['slug','name','category'] as $k) $p[$k]=required($b,$k,191);
    if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/',$p['slug'])) fail(422,'invalid_slug');
    need('categories',$p['category']);
    foreach (['name_en','unit','unit_en','image','image_alt','description','description_en','long_description','long_description_en'] as $k) $p[$k]=text_field($b,$k);
    $p['subcategory']=isset($b['subcategory'])?text_field($b,'subcategory'):null;
    web_url($p['image']);
    $p['price']=integer($b['price']??null,'price'); $p['stock']=integer($b['stock']??0,'stock',0,10000000);
    $p['featured']=boolean($b,'featured'); $p['status']=text_field($b,'status','published');
    if (!in_array($p['status'],['published','draft','hidden','archived'],true)) fail(422,'invalid_status');
    $p['tags']=$b['tags']??[]; $p['images']=$b['images']??[];
    if (!is_array($p['tags'])||!array_is_list($p['tags'])||count($p['tags'])>100) fail(422,'invalid_tags');
    foreach($p['tags'] as $tag) if(!is_string($tag)||strlen($tag)>100) fail(422,'invalid_tags');
    if (!is_array($p['images'])||!array_is_list($p['images'])||count($p['images'])>50) fail(422,'invalid_images');
    $p['images']=array_map(function($i) { if(!is_array($i)) fail(422,'invalid_images'); return ['url'=>web_url(required($i,'url',2048)),'alt'=>text_field($i,'alt')]; },$p['images']);
    return $p;
}
function category_input(array $b): array {
    $c=['name'=>required($b,'name',191)];
    foreach(['name_hu','name_en','description','description_en','image','image_alt','tagline'] as $k) $c[$k]=text_field($b,$k);
    web_url($c['image']); $c['order']=integer($b['order']??0,'order'); $c['active']=boolean($b,'active',true); return $c;
}
function category_list(bool $admin=false): array {
    $cats=rows('categories',$admin?'1':'active=1',[],'sort_order ASC');
    foreach($cats as &$c) $c['count']=(int)sql('SELECT COUNT(*) FROM products WHERE category=? AND status '.($admin?"<> 'archived'":"= 'published'"),[$c['name']])->fetchColumn();
    return $cats;
}
function products_list(): array {
    $where="status='published'"; $args=[];
    if (!empty($_GET['category'])) { $where.=' AND category=?'; $args[]=(string)$_GET['category']; }
    if (isset($_GET['featured'])) { $v=filter_var($_GET['featured'],FILTER_VALIDATE_BOOLEAN,FILTER_NULL_ON_FAILURE); if($v===null) fail(422,'invalid_featured'); $where.=' AND featured=?'; $args[]=(int)$v; }
    $items=rows('products',$where,$args);
    if (!empty($_GET['q'])) { $q=mb_strtolower((string)$_GET['q']); $items=array_values(array_filter($items,fn($p)=>str_contains(mb_strtolower(implode(' ',[$p['name'],$p['name_en']??'',$p['description']??'',implode(' ',$p['tags']??[])])),$q))); }
    usort($items,fn($a,$b)=>match($_GET['sort']??'recommended') {
        'price_asc'=>$a['price']<=>$b['price'], 'price_desc'=>$b['price']<=>$a['price'], 'newest'=>strcmp($b['created_at']??'',$a['created_at']??''),
        default=>[!($a['featured']??false),$a['stock']<=0]<=>[!($b['featured']??false),$b['stock']<=0],
    });
    return array_map('public_product',$items);
}
function subscribe(array $b): array {
    if(!boolean($b,'consent')) fail(400,'consent_required');
    $email=email_value($b); $d=['email'=>$email,'consent'=>true,'consented_at'=>now(),'lang'=>text_field($b,'lang','hu'),'source'=>text_field($b,'source','footer')];
    $s=sql('INSERT IGNORE INTO newsletter (email,document) VALUES (?,?)',[$email,json($d)]); return ['ok'=>true,'already'=>$s->rowCount()===0];
}
