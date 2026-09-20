<?php
declare(strict_types=1);
// Explicit admin action only; never run automatically during deployment.
function import_catalog_20260920(): array {
    $catalog=json_decode(file_get_contents(__DIR__.'/../database/catalog-20260920.json'),true,512,JSON_THROW_ON_ERROR);
    return tx(function() use($catalog) {
        $created=0; $updated=0; $skipped=0;
        foreach($catalog['categories'] as $c) {
            if(!one('categories',$c['name'])) save('categories',category_input($c),true);
        }
        foreach($catalog['products'] as $source) {
            $existing=rows('products','slug=?',[$source['slug']])[0]??null;
            if($existing) {
                $existing=need('products',$existing['product_id'],true);
                if(($existing['catalog_import']??'')==='20260920') { $skipped++; continue; }
            }
            $base=$existing??['product_id'=>uid('prd'),'price'=>0,'stock'=>0,'status'=>'draft','featured'=>false,'image'=>'','images'=>[],'created_at'=>now()];
            $body=array_replace($base,$source);
            $p=array_replace($base,product_input($body),['catalog_import'=>'20260920','updated_at'=>now()]);
            save('products',$p,!$existing);
            if($existing) $updated++; else $created++;
        }
        return compact('created','updated','skipped');
    });
}
