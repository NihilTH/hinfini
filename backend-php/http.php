<?php
declare(strict_types=1);
ini_set('display_errors','0');
require __DIR__.'/src/bootstrap.php';
header('X-Content-Type-Options: nosniff'); header('Cache-Control: no-store');
try {
    $origin=$_SERVER['HTTP_ORIGIN']??'';
    $allowed=array_filter(array_map('trim',explode(',',(string)cfg('CORS_ORIGINS'))));
    $site=rtrim((string)cfg('PUBLIC_SITE_URL'),'/'); if($site!=='') $allowed[]=$site;
    if($origin!==''&&in_array($origin,$allowed,true)) {
        header('Access-Control-Allow-Origin: '.$origin); header('Vary: Origin');
        header('Access-Control-Allow-Headers: Content-Type, X-Admin-Token, Signature'); header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    } elseif($origin!=='') fail(403,'origin_not_allowed');
    $method=$_SERVER['REQUEST_METHOD']??'GET';
    if($method==='OPTIONS') { http_response_code(204); exit; }
    $path=parse_url($_SERVER['REQUEST_URI']??'/',PHP_URL_PATH);
    if($path!=='/api'&&!str_starts_with($path,'/api/')) fail(404,'Not found');
    $path='/'.trim(rawurldecode(substr($path,4)),'/');
    $raw=''; $body=[];
    if(!str_starts_with($_SERVER['CONTENT_TYPE']??'','multipart/form-data')) {
        $raw=file_get_contents('php://input',false,null,0,1048577);
        if(strlen($raw)>1048576) fail(413,'request_too_large');
        if($raw!=='') { $body=json_decode($raw,true,64,JSON_THROW_ON_ERROR); if(!is_array($body)||!str_starts_with(ltrim($raw),'{')) fail(422,'object_required'); }
    }
    if($method==='POST'&&$path==='/payments/ipn') payment_ipn($raw);
    respond(route($method,$path,$body));
} catch(HttpError $e) { respond(['detail'=>$e->getMessage()],$e->status); }
catch(JsonException $e) { respond(['detail'=>'invalid_json'],400); }
catch(PDOException $e) {
    $code=(int)($e->errorInfo[1]??0);
    if($code===1062) respond(['detail'=>'slug_or_identifier_exists'],409);
    if(in_array($code,[1451,1452],true)) respond(['detail'=>'related_record_required_or_in_use'],409);
    if(in_array($code,[1205,1213],true)) respond(['detail'=>'concurrent_update_retry'],409);
    error_log('HINFINI database failure: '.$e->getCode()); respond(['detail'=>'database_unavailable'],503);
} catch(Throwable $e) { error_log('HINFINI: '.$e->getMessage()); respond(['detail'=>'internal_error'],500); }
