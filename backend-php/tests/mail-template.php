<?php
require dirname(__DIR__).'/src/bootstrap.php';
function check(bool $ok): void { if(!$ok)throw new RuntimeException('Mail template assertion failed'); }
$o=['order_id'=>'test-order','full_name'=>'<script>alert(1)</script>','email'=>'buyer@example.test','items'=>[['name'=>'Gyertya <b>teszt</b>','price'=>1500,'quantity'=>2,'line_total'=>3000,'image'=>'https://example.test/candle.png']],'discount'=>500,'coupon_code'=>'TESZT','shipping'=>1990,'total'=>4490,'payment_status'=>'PAID','invoice'=>['number'=>'TEST-1','url'=>'https://example.test/invoice?a=1&b=2']];
[$subject,$html,$text]=mail_template('invoice_ready',$o);
check(str_contains($html,'Számla megnyitása'));
check(str_contains($html,'https://example.test/invoice?a=1&amp;b=2'));
check(str_contains($html,'https://example.test/candle.png'));
check(str_contains($html,'Gyertya &lt;b&gt;teszt&lt;/b&gt;'));
check(!str_contains($html,'<script>'));
check(str_contains($text,'4'.'490')||str_contains($text,'4490'));
$o['invoice']['url']='javascript:alert(1)';$o['items'][0]['image']='javascript:alert(1)';
[, $html]=mail_template('invoice_ready',$o);
check(!str_contains($html,'href="javascript:'));
check(!str_contains($html,'src="javascript:'));
[, $html,$text]=mail_template('order_created',$o);
check(!str_contains($html,'Számla megnyitása'));
check(str_contains($text,'nem igazolja a sikeres fizetést'));
echo "Mail template: escaping, safe links, product photos, invoice and payment copy passed.\n";
