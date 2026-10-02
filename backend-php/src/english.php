<?php
declare(strict_types=1);
// Reviewed translations of the public Hungarian catalogue on 2026-10-02.
// Exact source matching prevents applying an old translation to newly edited copy.
function english_catalog(): array {
    static $data;
    return $data ??= json_decode(file_get_contents(__DIR__.'/../database/english-20261002.json'),true,512,JSON_THROW_ON_ERROR);
}
function english_field(array $doc, string $field, ?string $source=null, array $placeholders=[]): array {
    $source ??= (string)($doc[$field]??'');
    $data=english_catalog(); $target=$data['translations'][$source]??null;
    $key=$field.'_en'; $current=(string)($doc[$key]??'');
    $replace=array_merge(['',$source],$placeholders,$data['replace'][$source]??[]);
    if($target!==null && in_array($current,$replace,true)) $doc[$key]=$target;
    return $doc;
}
function english_product(array $p): array {
    foreach(['name','unit','description','long_description','usage_instructions'] as $field) $p=english_field($p,$field);
    if(isset($p['attributes'])) foreach($p['attributes'] as &$a) {
        $a=english_field(english_field($a,'label'),'value');
    }
    return $p;
}
function english_category(array $c): array {
    $c=english_field($c,'name',(string)($c['name_hu']??$c['name']),[(string)$c['name']]);
    return english_field($c,'description');
}
function import_english_catalog(): array {
    return tx(function() {
        $products=0; $categories=0; $unchanged=0;
        foreach(['products'=>'english_product','categories'=>'english_category'] as $table=>$translate) {
            foreach(rows($table) as $row) {
                $old=need($table,$row[IDS[$table]],true);
                $new=$translate($old);
                if($new===$old) { $unchanged++; continue; }
                $new['updated_at']=now(); save($table,$new);
                if($table==='products') $products++; else $categories++;
            }
        }
        return compact('products','categories','unchanged');
    });
}
