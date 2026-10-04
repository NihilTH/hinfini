<?php
declare(strict_types=1);
require dirname(__DIR__).'/src/bootstrap.php';
if(!str_ends_with((string)cfg('DB_NAME'),'_test'))throw new RuntimeException('Test database required');
function check(bool $ok,string $message): void {if(!$ok)throw new RuntimeException($message);}
function rejects(callable $fn): void {try{$fn();}catch(Throwable $e){return;}throw new RuntimeException('Expected rejection');}
putenv('PAYMENT_PROVIDER=barion');putenv('BARION_ENABLED=0');
check(!payment_enabled(),'Disabled by default');rejects(fn()=>barion_start(['order_id'=>'missing']));
putenv('BARION_ENABLED=1');putenv('BARION_TEST_POS_KEY=test-key');putenv('BARION_TEST_PAYEE_EMAIL=merchant@example.test');
putenv('PUBLIC_SITE_URL=https://example.test');putenv('ORDER_NOTIFY_EMAIL=owner@example.test');putenv('ORDER_NOTIFY_COPY_EMAIL=copy@example.test');putenv('EMAIL_PROVIDER=php_mail');
putenv('INVOICE_PROVIDER=szamlazz');putenv('SZAMLAZZ_ENABLED=1');putenv('SZAMLAZZ_TEST_AGENT_KEY=test-agent-key');putenv('INVOICE_VAT=AAM');
$id=uid('ord');$ref='barion_'.bin2hex(random_bytes(16));$pid='12345678-1234-1234-1234-123456789abc';
$o=['order_id'=>$id,'order_ref'=>$ref,'payment_provider'=>'barion','payment_environment'=>'sandbox','payment_status'=>'UNPAID','fulfillment_status'=>'AWAITING_PAYMENT','status'=>'PENDING','created_at'=>now(),'invoice'=>['status'=>'NONE'],'history'=>[],
 'full_name'=>'Test <Buyer>','email'=>'buyer@example.test','address'=>'Main & Other 1','city'=>'Debrecen','postal_code'=>'4024','lang'=>'hu','total'=>2890,'shipping'=>1990,'discount'=>100,'coupon_code'=>'TEST','items'=>[['name'=>'Gyertya 🕯️','price'=>1000,'quantity'=>1,'line_total'=>1000]]];
save('orders',$o,true);sql("INSERT INTO payment_attempts (order_ref,order_id,state,expires_at,created_at) VALUES (?,?,'STARTING',?,?)",[$ref,$id,time()+1800,now()]);
$payload=barion_payload($o,$ref,'sandbox');check($payload['Transactions'][0]['Total']===2890,'Server total');check($payload['CallbackUrl']==='https://example.test/api/payments/barion/callback','Callback');
$d=['PaymentId'=>$pid,'PaymentRequestId'=>$ref,'OrderNumber'=>$id,'PaymentType'=>'Immediate','Currency'=>'HUF','Total'=>2890,'POSOwnerEmail'=>'merchant@example.test','Status'=>'Succeeded'];
foreach(['Total'=>1,'Currency'=>'EUR','OrderNumber'=>'wrong','POSOwnerEmail'=>'wrong@example.test','PaymentRequestId'=>'missing'] as $k=>$v)rejects(fn()=>barion_apply(array_replace($d,[$k=>$v]),$pid,'sandbox'));
check(need('orders',$id)['payment_status']==='UNPAID','Mismatches do not pay');
barion_apply($d,$pid,'sandbox');barion_apply($d,$pid,'sandbox');barion_apply(array_replace($d,['Status'=>'Failed']),$pid,'sandbox');
$o=need('orders',$id);check($o['payment_status']==='PAID','Verified paid and monotonic');check($o['invoice']['status']==='QUEUED','Invoice queued');
$logs=rows('email_logs','order_id=?',[$id]);check(count($logs)===3,'One buyer plus two internal messages, no duplicates');
check(count(array_filter($logs,fn($l)=>$l['recipient']==='copy@example.test'))===1,'Copy recipient');
$xml=invoice_xml($o,'test-agent-key');check(str_contains($xml,'<afakulcs>AAM</afakulcs>'),'AAM');check(str_contains($xml,'Test &lt;Buyer&gt;'),'Escaping');check(str_contains($xml,'<fizetve>true</fizetve>'),'Paid invoice');check(!str_contains($xml,'<azonosito>'),'No shared buyer identifier');
rejects(fn()=>invoice_xml(array_replace($o,['total'=>1]),'key'));
$count=0;$transport=function($xml)use(&$count){$count++;return ['status'=>200,'headers'=>['szlahu_szamlaszam'=>'TEST-1','szlahu_bruttovegosszeg'=>'2890'],'body'=>"%PDF-1.4\nTest fixture"];};
invoice_worker(10,$transport);invoice_worker(10,$transport);check($count===1,'Exactly one invoice submission');
$o=need('orders',$id);check($o['invoice']['status']==='ISSUED','Invoice saved');check(is_file(invoice_path($id)),'PDF stored privately');
check(!isset(public_order($o)['invoice']),'Public order excludes invoice token');
$token=basename($o['invoice']['url']);check(hash('sha256',$token)===$o['invoice']['download_hash'],'Download token');rejects(fn()=>invoice_download($id,'wrong'));
check(count(rows('email_logs','order_id=?',[$id]))===4,'Invoice email queued once');
// A timeout is ambiguous: retain review status and NEVER automatically resubmit.
$o['order_id']=uid('ord');$o['invoice']=['status'=>'QUEUED'];save('orders',$o,true);
$attempts=0;$timeout=function($xml)use(&$attempts){$attempts++;throw new RuntimeException('timeout');};invoice_worker(10,$timeout);invoice_worker(10,$timeout);
check($attempts===1&&need('orders',$o['order_id'])['invoice']['status']==='REVIEW','No retry after unknown provider result');
// A test payment cannot consume the live invoice key.
putenv('SZAMLAZZ_TEST_AGENT_KEY');putenv('SZAMLAZZ_AGENT_KEY=live-only');check(!invoice_ready_config('sandbox'),'Test/live isolation');
// A late successful payment after cancellation requires manual review, not an invoice.
$o['order_id']=uid('ord');$o['order_ref']='barion_'.bin2hex(random_bytes(16));$o['payment_status']='UNPAID';$o['fulfillment_status']='CANCELLED';$o['invoice']=['status'=>'NONE'];save('orders',$o,true);
sql("INSERT INTO payment_attempts (order_ref,order_id,state,expires_at,created_at) VALUES (?,?,'STARTING',?,?)",[$o['order_ref'],$o['order_id'],time()+1800,now()]);
barion_apply(array_replace($d,['PaymentRequestId'=>$o['order_ref'],'OrderNumber'=>$o['order_id']]),$pid,'sandbox');$o=need('orders',$o['order_id']);
check($o['payment_review_required']&&$o['fulfillment_status']==='CANCELLED'&&$o['invoice']['status']==='NONE','Canceled payment review');
unlink(invoice_path($id));
echo "PASS: Barion verification, replay protection, dual email, invoice totals, escaping, private PDF, timeout and test/live isolation.\n";
