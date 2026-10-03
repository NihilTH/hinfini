<?php
declare(strict_types=1);
function homepage_settings(): array {
    $stored=one('settings','homepage')??[];
    return [
        'media_id'=>(string)($stored['media_id']??''),
        'image'=>(string)($stored['image']??'/hero-candle-pouring.webp'),
        'alt'=>(string)($stored['alt']??'Gyertyaöntés fekete-arany üvegtégelybe'),
        'alt_en'=>(string)($stored['alt_en']??'Candle pouring into a black and gold glass container'),
    ];
}
function homepage_save(array $b): array {
    return tx(function() use($b) {
        $id=text_field($b,'media_id','',191);
        // Only an existing, validated media upload can become the public hero image.
        $media=$id!==''?need('media',$id,true):null;
        $d=['key'=>'homepage','media_id'=>$id,'image'=>$media?$media['url']:'/hero-candle-pouring.webp',
            'alt'=>text_field($b,'alt','',500),'alt_en'=>text_field($b,'alt_en','',500)];
        $old=one('settings','homepage',true); save('settings',$d,!$old);
        return homepage_settings();
    });
}
