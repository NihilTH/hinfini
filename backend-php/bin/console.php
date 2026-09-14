<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli') { http_response_code(404); exit; }
require dirname(__DIR__).'/src/bootstrap.php';
try {
    $cmd=$argv[1]??'help';
    if($cmd==='migrate') { db()->exec(file_get_contents(dirname(__DIR__).'/database/schema.sql')); echo "Schema installed.\n"; }
    elseif($cmd==='seed') {
        tx(function() {
            foreach(['categories','products','guides'] as $t) {
                if((int)sql('SELECT COUNT(*) FROM '.table($t))->fetchColumn()>0) continue;
                foreach(json_decode(file_get_contents(dirname(__DIR__).'/database/seed.json'),true,512,JSON_THROW_ON_ERROR)[$t] as $d) save($t,$d,true);
            }
        }); echo "Seed complete (existing tables preserved).\n";
    } elseif($cmd==='mail:send') echo 'Processed: '.mail_worker(50)."\n";
    elseif($cmd==='import') {
        $dir=$argv[2]??''; if(!is_dir($dir)) throw new RuntimeException('Supply MongoDB JSON export directory');
        tx(function() use($dir) {
            // Require empty targets: never silently overwrite existing orders or stock.
            foreach(array_keys(IDS) as $t) if((int)sql('SELECT COUNT(*) FROM '.table($t))->fetchColumn()) throw new RuntimeException('Import requires empty target tables');
            foreach(['categories','products','guides','orders','media','newsletter','email_logs'] as $t) {
                $file=$dir.'/'.$t.'.json'; if(!is_file($file)) continue;
                $text=file_get_contents($file); $docs=str_starts_with(ltrim($text),'[')?json_decode($text,true,512,JSON_THROW_ON_ERROR):array_map(fn($s)=>json_decode($s,true,512,JSON_THROW_ON_ERROR),array_filter(explode("\n",trim($text))));
                foreach($docs as $d) {
                    unset($d['_id']);
                    if($t==='categories') $d+=['order'=>0,'active'=>true,'name_hu'=>$d['name'],'name_en'=>$d['name']];
                    if($t==='products') { $d+=['status'=>'published','created_at'=>now(),'images'=>[],'tags'=>[],'name_en'=>'','image_alt'=>'']; $d['price']=integer($d['price'],'price'); $d['stock']=integer($d['stock'],'stock'); }
                    if($t==='orders') {
                        $d+=['payment_status'=>'UNPAID','fulfillment_status'=>'AWAITING_PAYMENT','created_at'=>now(),'history'=>[],'invoice'=>['status'=>'NONE']];
                        $d['stock_released']=$d['fulfillment_status']==='CANCELLED';
                    }
                    if($t==='email_logs') { $d['idempotency_key']=hash('sha256',$d['idempotency_key']??$d['log_id']); $d['status']=in_array($d['status']??'', ['QUEUED','SENDING'],true)?'FAILED':($d['status']??'FAILED'); }
                    save($t,$d,true);
                    if($t==='orders'&&!empty($d['order_ref'])) sql('INSERT INTO payment_attempts (order_ref,order_id,transaction_id,state,expires_at,created_at) VALUES (?,?,?,?,?,?)',[$d['order_ref'],$d['order_id'],isset($d['transaction_id'])?(string)$d['transaction_id']:null,$d['status']??'UNKNOWN',0,$d['created_at']]);
                }
            }
        }); echo "Import complete. Copy local image files separately; existing S3 URLs remain intact.\n";
    } else echo "Commands: migrate | seed | import /private/export-directory | mail:send\n";
} catch(Throwable $e) { fwrite(STDERR,$e->getMessage()."\n"); exit(1); }
