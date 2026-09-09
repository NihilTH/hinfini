<?php
declare(strict_types=1);
const IMAGE_TYPES=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp','image/gif'=>'gif'];
function upload_dir(): string { return rtrim((string)cfg('UPLOAD_DIR',dirname(__DIR__).'/uploads'),'/'); }
function safe_key(string $key): string { if(!preg_match('~^\d{4}/\d{2}/[a-f0-9]{32}\.(jpg|png|webp|gif)$~D',$key)) fail(404,'Not found'); return $key; }
function s3_request(string $method,string $key,string $body='',string $type='application/octet-stream'): void {
    $endpoint=rtrim((string)cfg('S3_ENDPOINT_URL'),'/');
    foreach(['S3_BUCKET','S3_ACCESS_KEY_ID','S3_SECRET_ACCESS_KEY','S3_ENDPOINT_URL'] as $k) if(!cfg($k)) throw new RuntimeException('Missing S3 configuration');
    if(parse_url($endpoint,PHP_URL_SCHEME)!=='https'||parse_url($endpoint,PHP_URL_QUERY)||parse_url($endpoint,PHP_URL_USER)) throw new RuntimeException('Invalid S3 endpoint');
    $path=(parse_url($endpoint,PHP_URL_PATH)??'').'/'.rawurlencode((string)cfg('S3_BUCKET')).'/'.implode('/',array_map('rawurlencode',explode('/',$key)));
    $host=parse_url($endpoint,PHP_URL_HOST).(parse_url($endpoint,PHP_URL_PORT)?':'.parse_url($endpoint,PHP_URL_PORT):'');
    $date=gmdate('Ymd'); $stamp=gmdate('Ymd\THis\Z'); $hash=hash('sha256',$body); $region=(string)cfg('S3_REGION','auto');
    $headers="content-type:$type\nhost:$host\nx-amz-content-sha256:$hash\nx-amz-date:$stamp\n";
    $signed='content-type;host;x-amz-content-sha256;x-amz-date'; $scope="$date/$region/s3/aws4_request";
    $canonical="$method\n$path\n\n$headers\n$signed\n$hash";
    $signing=hash_hmac('sha256',$date,'AWS4'.cfg('S3_SECRET_ACCESS_KEY'),true);
    foreach([$region,'s3','aws4_request'] as $part) $signing=hash_hmac('sha256',$part,$signing,true);
    $sig=hash_hmac('sha256',"AWS4-HMAC-SHA256\n$stamp\n$scope\n".hash('sha256',$canonical),$signing);
    $r=http_request('https://'.$host.$path,$body,['Content-Type: '.$type,'Host: '.$host,'x-amz-content-sha256: '.$hash,'x-amz-date: '.$stamp,
        'Authorization: AWS4-HMAC-SHA256 Credential='.cfg('S3_ACCESS_KEY_ID').'/'.$scope.', SignedHeaders='.$signed.', Signature='.$sig],$method);
    if($r['status']<200||$r['status']>=300) throw new RuntimeException('S3 HTTP '.$r['status']);
}
function media_upload(): array {
    $file=$_FILES['file']??null;
    if(!$file||$file['error']!==UPLOAD_ERR_OK||!is_uploaded_file($file['tmp_name'])) fail(400,'upload_failed');
    $size=filesize($file['tmp_name']); if($size>(int)cfg('MAX_UPLOAD_MB',5)*1024*1024) fail(400,'file_too_large');
    $type=(new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    if(!isset(IMAGE_TYPES[$type])||!getimagesize($file['tmp_name'])) fail(400,'unsupported_type');
    $key=gmdate('Y/m').'/'.bin2hex(random_bytes(16)).'.'.IMAGE_TYPES[$type];
    $driver=(string)cfg('STORAGE_DRIVER','local');
    if($driver==='s3') {
        web_url((string)cfg('S3_PUBLIC_BASE_URL')); if(!cfg('S3_PUBLIC_BASE_URL')) fail(503,'s3_public_url_required');
        s3_request('PUT',$key,file_get_contents($file['tmp_name']),$type); $url=rtrim((string)cfg('S3_PUBLIC_BASE_URL'),'/').'/'.$key;
    } elseif($driver==='local') {
        $path=upload_dir().'/'.$key;
        if(!is_dir(dirname($path))&&!mkdir(dirname($path),0750,true)) throw new RuntimeException('Cannot create upload directory');
        if(!move_uploaded_file($file['tmp_name'],$path)) throw new RuntimeException('Cannot save upload');
        $url=rtrim((string)cfg('PUBLIC_SITE_URL'),'/').'/api/uploads/'.$key;
    } else fail(503,'invalid_storage_driver');
    $d=['media_id'=>uid('med'),'url'=>$url,'key'=>$key,'filename'=>basename($file['name']),'content_type'=>$type,'size'=>$size,'alt'=>text_field($_POST,'alt'),'driver'=>$driver,'created_at'=>now()];
    save('media',$d,true); return $d;
}
function media_delete(string $id): array {
    $m=need('media',$id); $url=$m['url'];
    foreach(['products','categories','guides','orders'] as $t) foreach(rows($t) as $d) if(str_contains(json($d),json_encode($url,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE))) fail(400,'media_in_use');
    $key=safe_key($m['key']);
    if($m['driver']==='s3') s3_request('DELETE',$key);
    else { $path=upload_dir().'/'.$key; if(is_file($path)&&!unlink($path)) throw new RuntimeException('Cannot delete upload'); }
    remove('media',$id); return ['ok'=>true];
}
function serve_upload(string $key): never {
    $path=upload_dir().'/'.safe_key($key);
    if(!is_file($path)) fail(404,'Not found');
    $type=(new finfo(FILEINFO_MIME_TYPE))->file($path); if(!isset(IMAGE_TYPES[$type])) fail(404,'Not found');
    header('Content-Type: '.$type); header('Content-Length: '.filesize($path)); header('Cache-Control: public, max-age=31536000, immutable');
    header("Content-Security-Policy: default-src 'none'; sandbox"); readfile($path); exit;
}
