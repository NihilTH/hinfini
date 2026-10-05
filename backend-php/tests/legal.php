<?php
declare(strict_types=1);
require dirname(__DIR__).'/src/bootstrap.php';
if(!str_ends_with((string)cfg('DB_NAME'),'_test'))throw new RuntimeException('Test database required');
function legal_check(bool $ok,string $message): void {if(!$ok)throw new RuntimeException($message);}
putenv('EMAIL_PROVIDER=none');putenv('ORDER_NOTIFY_EMAIL=owner@example.test');putenv('ORDER_NOTIFY_COPY_EMAIL=copy@example.test');
putenv('SHIPPING_FEE_HOME=2345');putenv('FREE_SHIPPING_FROM=30000');
$t=legal_text();legal_check(str_contains($t,'2345')&&str_contains($t,'30000')&&!str_contains($t,'{shipping'),'Config in durable terms');
legal_check(file_get_contents(dirname(__DIR__).'/database/legal.json')===file_get_contents(dirname(__DIR__,2).'/frontend/src/data/legal.json'),'Frontend/backend legal text matches');
$r=withdrawal_create(['confirmed'=>true,'full_name'=>'<script>test</script>','email'=>'buyer@example.test','contract'=>'Order reference text','message'=>'One candle','lang'=>'en']);
$d=need('settings',$r['reference']);legal_check($d['statement']===$r['statement'],'Durable saved notice');
$logs=rows('email_logs','order_id=?',[$r['reference']]);legal_check(count($logs)===3,'Buyer and two internal acknowledgements');
foreach($logs as $log){legal_check(str_contains($log['text_body'],$r['received_at']),'Timestamp in receipt');legal_check(!str_contains($log['html_body'],'<script>'),'Notice HTML escaped');}
try{route('GET','/admin/withdrawals',[]);throw new RuntimeException('Unprotected private route');}catch(HttpError $e){legal_check($e->status===401,'Admin required');}
try{route('GET','/withdrawals/'.$r['reference'],[]);throw new RuntimeException('Public notice exposure');}catch(HttpError $e){legal_check($e->status===404,'No public notice retrieval');}
echo "PASS: legal snapshots, configuration consistency, withdrawal storage, private access, receipt escaping and recipients.\n";
