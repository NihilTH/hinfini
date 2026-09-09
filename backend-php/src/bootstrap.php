<?php
declare(strict_types=1);

// Configuration stays outside public_html. Environment variables override config.local.php.
$local = is_file(dirname(__DIR__) . '/config.local.php') ? require dirname(__DIR__) . '/config.local.php' : [];
function cfg(string $key, mixed $default = ''): mixed {
    global $local;
    $value = getenv($key);
    return $value !== false ? $value : ($local[$key] ?? $default);
}
function now(): string { return gmdate('Y-m-d\TH:i:s\Z'); }
function uid(string $prefix): string { return $prefix . '_' . bin2hex(random_bytes(16)); }
function json(array $value): string { return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR); }
class HttpError extends RuntimeException {
    public function __construct(public int $status, string $detail) { parent::__construct($detail); }
}
function fail(int $status, string $detail): never { throw new HttpError($status, $detail); }
function respond(mixed $value, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    exit;
}
function db(): PDO {
    static $pdo;
    if (!$pdo) {
        foreach (['DB_HOST', 'DB_NAME'] as $key) if (!preg_match('/^[a-zA-Z0-9_.-]+$/', (string)cfg($key, $key === 'DB_HOST' ? 'localhost' : 'hinfini'))) throw new RuntimeException('Invalid database configuration');
        $dsn = 'mysql:host=' . cfg('DB_HOST', 'localhost') . ';port=' . (int)cfg('DB_PORT', 3306) . ';dbname=' . cfg('DB_NAME', 'hinfini') . ';charset=utf8mb4';
        $pdo = new PDO($dsn, (string)cfg('DB_USER'), (string)cfg('DB_PASSWORD'), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    }
    return $pdo;
}
function sql(string $query, array $args = []): PDOStatement { $s = db()->prepare($query); $s->execute($args); return $s; }
function tx(callable $fn): mixed {
    db()->beginTransaction();
    try { $result = $fn(); db()->commit(); return $result; }
    catch (Throwable $e) { if (db()->inTransaction()) db()->rollBack(); throw $e; }
}
// Core fields have SQL columns/indexes; bilingual content and snapshots retain the API's JSON shape.
const IDS = ['products'=>'product_id','categories'=>'name','guides'=>'slug','orders'=>'order_id','media'=>'media_id','newsletter'=>'email','email_logs'=>'log_id'];
const COLS = ['products'=>['slug','category','price','stock','status','featured'], 'categories'=>['sort_order','active'], 'orders'=>['payment_status','fulfillment_status','total','created_at'], 'email_logs'=>['order_id','idempotency_key','status','created_at'], 'guides'=>[], 'media'=>[], 'newsletter'=>[]];
function table(string $table): string { if (!isset(IDS[$table])) throw new LogicException('Unknown table'); return '`'.$table.'`'; }
function one(string $table, string $id, bool $lock = false): ?array {
    $s = sql('SELECT document FROM '.table($table).' WHERE `'.IDS[$table].'`=?'.($lock?' FOR UPDATE':''), [$id]);
    $r = $s->fetchColumn(); return $r === false ? null : json_decode($r, true, 512, JSON_THROW_ON_ERROR);
}
function need(string $table, string $id, bool $lock = false): array { return one($table,$id,$lock) ?? fail(404,'Not found'); }
function rows(string $table, string $where = '1', array $args = [], string $order = ''): array {
    return array_map(fn($r)=>json_decode($r['document'],true,512,JSON_THROW_ON_ERROR),sql('SELECT document FROM '.table($table).' WHERE '.$where.($order?' ORDER BY '.$order:''),$args)->fetchAll());
}
function save(string $table, array $doc, bool $insert = false): void {
    $id = IDS[$table]; $data = [$id=>$doc[$id]];
    foreach (COLS[$table] as $col) $data[$col] = match($col) {
        'sort_order'=>(int)($doc['order']??0), 'active','featured'=>(int)($doc[$col]??($col==='active')),
        'price','stock','total'=>(int)($doc[$col]??0), default=>$doc[$col]??null,
    };
    $data['document'] = json($doc);
    $cols = array_keys($data);
    if ($insert) sql('INSERT INTO '.table($table).' (`'.implode('`,`',$cols).'`) VALUES ('.implode(',',array_fill(0,count($cols),'?')).')',array_values($data));
    else { unset($data[$id]); sql('UPDATE '.table($table).' SET '.implode(',',array_map(fn($c)=>'`'.$c.'`=?',array_keys($data))).' WHERE `'.$id.'`=?',[...array_values($data),$doc[$id]]); }
}
function remove(string $table,string $id): void { sql('DELETE FROM '.table($table).' WHERE `'.IDS[$table].'`=?',[$id]); }
function text_field(array $body, string $key, string $default = '', int $max = 10000): string {
    $v = $body[$key]??$default;
    if (!is_string($v) || strlen($v)>$max) fail(422,'invalid_'.$key);
    return trim($v);
}
function required(array $body,string $key,int $max=250): string { $v=text_field($body,$key,'',$max); if ($v==='') fail(422,'required_'.$key); return $v; }
function integer(mixed $v,string $key,int $min=0,int $max=1000000000): int { if (!is_int($v)||$v<$min||$v>$max) fail(422,'invalid_'.$key); return $v; }
function boolean(array $body,string $key,bool $default=false): bool { $v=$body[$key]??$default; if (!is_bool($v)) fail(422,'invalid_'.$key); return $v; }
function email_value(array $body): string { $e=strtolower(required($body,'email',254)); if (!filter_var($e,FILTER_VALIDATE_EMAIL)) fail(422,'invalid_email'); return $e; }
function web_url(string $v): string { if ($v!=='' && (!filter_var($v,FILTER_VALIDATE_URL)||!in_array(parse_url($v,PHP_URL_SCHEME),['https','http'],true))) fail(422,'invalid_url'); return $v; }
function admin_auth(): void {
    $key=hash('sha256',$_SERVER['REMOTE_ADDR']??'unknown');
    $status=tx(function() use($key) {
        sql('INSERT IGNORE INTO auth_attempts (ip_hash, failures, window_start) VALUES (?,0,?)',[$key,time()]);
        $r=sql('SELECT * FROM auth_attempts WHERE ip_hash=? FOR UPDATE',[$key])->fetch();
        if (time()-(int)$r['window_start']>=600) { $r['failures']=0; sql('UPDATE auth_attempts SET failures=0,window_start=? WHERE ip_hash=?',[time(),$key]); }
        if ((int)$r['failures']>=8) return 429;
        if (cfg('ADMIN_TOKEN')!=='' && hash_equals((string)cfg('ADMIN_TOKEN'),$_SERVER['HTTP_X_ADMIN_TOKEN']??'')) {
            sql('DELETE FROM auth_attempts WHERE ip_hash=?',[$key]); return 200;
        }
        sql('UPDATE auth_attempts SET failures=failures+1 WHERE ip_hash=?',[$key]); return 401;
    });
    if ($status!==200) fail($status,'Érvénytelen hozzáférés vagy túl sok próbálkozás.');
}
require __DIR__.'/catalog.php';
require __DIR__.'/mail.php';
require __DIR__.'/orders.php';
require __DIR__.'/payments.php';
require __DIR__.'/media.php';
require __DIR__.'/routes.php';
