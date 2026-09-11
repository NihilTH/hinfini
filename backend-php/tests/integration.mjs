// Runs only against a dedicated *_test database. Starts its own disposable HTTP server.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { resolve } from 'node:path';
if(!process.env.DB_NAME?.endsWith('_test')) throw Error('DB_NAME must end with _test');
const root=resolve(import.meta.dirname,'../..');
const php=process.env.PHP_BINARY||'php';
const server=spawn(php,['-S','127.0.0.1:8001','backend-php/router.php'],{cwd:root,env:{...process.env,PHP_CLI_SERVER_WORKERS:'4',EMAIL_PROVIDER:'resend',BANK_ACCOUNT_NAME:'Test Merchant',BANK_ACCOUNT_NUMBER:'TEST-ACCOUNT'},stdio:['ignore','ignore','pipe'],detached:true});
let stderr=''; server.stderr.on('data',d=>stderr+=d);
const base='http://127.0.0.1:8001/api';
async function request(method,path,body,admin=false,headers={}) {
 const r=await fetch(base+path,{method,headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(admin?{'X-Admin-Token':process.env.ADMIN_TOKEN}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body)});
 const data=await r.json(); return {status:r.status,data,headers:r.headers};
}
async function ok(method,path,body,admin=false) {const r=await request(method,path,body,admin); assert.equal(r.status,200,JSON.stringify(r.data)); return r.data;}
function sqlPHP(code) {
 const r=spawnSync(php,['-r',`require 'backend-php/src/bootstrap.php'; ${code}`],{cwd:root,env:process.env,encoding:'utf8'});
 assert.equal(r.status,0,r.stderr); return r.stdout;
}
let checks=0;
try {
 for(let i=0;i<50;i++) {try {await fetch(base+'/');break;}catch{await new Promise(r=>setTimeout(r,100));}}
 assert.equal((await request('POST','/admin/verify',{})).status,401); checks++;
 await ok('POST','/admin/verify',{},true);
 const cats=await ok('GET','/categories'); assert(cats.length>0);
 const tag=Date.now().toString();
 const p=await ok('POST','/admin/products',{slug:'integration-'+tag,name:'Teszt gyertya',category:cats[0].name,price:1000,stock:3},true);
 assert.equal((await request('POST','/admin/products',{slug:'bad',name:'Bad',category:cats[0].name,price:-1},true)).status,422);checks++;
 const checkout={items:[{product_id:p.product_id,quantity:2}],full_name:'Teszt Vásárló',email:'buyer@example.test',address:'Teszt utca 1.',city:'Debrecen',postal_code:'4024',accepted_terms:true};
 const parallel=await Promise.all([request('POST','/orders',checkout),request('POST','/orders',checkout)]);
 assert.deepEqual(parallel.map(r=>r.status).sort(),[200,400]); checks++;
 const oid=parallel.find(r=>r.status===200).data.order_id;
 const o=await ok('GET','/orders/'+oid); assert.equal(o.subtotal,2000);assert.equal(o.total,3990);assert.equal(o.email,undefined);checks++;
 assert.equal((await request('POST','/orders',{...checkout,items:[{product_id:p.product_id,quantity:1},{product_id:p.product_id,quantity:1}]})).status,400);checks++;
 assert.equal((await request('PATCH',`/admin/orders/${oid}/status`,{fulfillment_status:'PAID'},true)).status,409);checks++;
 await Promise.all([ok('PATCH',`/admin/orders/${oid}/status`,{fulfillment_status:'CANCELLED'},true),ok('PATCH',`/admin/orders/${oid}/status`,{fulfillment_status:'CANCELLED'},true)]);
 assert.equal((await ok('GET','/products/'+p.slug)).stock,3);checks++;
 assert.equal((await request('PATCH',`/admin/orders/${oid}/status`,{fulfillment_status:'NEW'},true)).status,409);checks++;
 const paid=await ok('POST','/orders',{...checkout,items:[{product_id:p.product_id,quantity:1}]});
 const ref=paid.order_id+'-test';
 sqlPHP(`sql("INSERT INTO payment_attempts (order_ref,order_id,transaction_id,state,expires_at,created_at) VALUES (?,?,?,'REDIRECTING',0,?)",[${JSON.stringify(ref)},${JSON.stringify(paid.order_id)},'1001',now()]);`);
 const signature=raw=>createHmac('sha384',process.env.SIMPLEPAY_SECRET_KEY).update(raw).digest('base64');
 const returnRaw=JSON.stringify({o:ref,e:'SUCCESS',t:1001});
 await ok('POST','/payments/return',{r:Buffer.from(returnRaw).toString('base64'),s:signature(returnRaw)});
 assert.equal((await ok('GET','/orders/'+paid.order_id)).payment_status,'UNPAID');checks++;
 let msg={merchant:process.env.SIMPLEPAY_MERCHANT_ID,orderRef:ref,status:'FINISHED',transactionId:1001,total:paid.total,currency:'HUF'};
 const ipn=async m=>request('POST','/payments/ipn',m,false,{Signature:signature(JSON.stringify(m))});
 assert.equal((await request('POST','/payments/ipn',msg)).status,400);
 assert.equal((await ipn({...msg,total:1})).status,400);
 assert.equal((await ipn({...msg,merchant:'WRONG'})).status,400);
 assert.equal((await ipn({...msg,transactionId:2})).status,400);checks++;
 const signedResponse=await fetch(base+'/payments/ipn',{method:'POST',headers:{'Content-Type':'application/json',Signature:signature(JSON.stringify(msg))},body:JSON.stringify(msg)});
 const ack=await signedResponse.text(); assert.equal(signedResponse.status,200); assert.equal(signedResponse.headers.get('signature'),signature(ack));checks++;
 await ipn(msg); await ipn({...msg,status:'TIMEOUT'});
 assert.equal((await ok('GET','/orders/'+paid.order_id)).payment_status,'PAID');
 const emails=await ok('GET','/admin/emails?order_id='+paid.order_id,undefined,true);
 assert.equal(emails.filter(e=>e.event==='payment_success').length,1);checks++;
 await ok('PATCH',`/admin/orders/${paid.order_id}/status`,{fulfillment_status:'SHIPPED',tracking_carrier:'Test'},true);
 const renamed='Integration '+tag;
 await ok('POST','/admin/categories',{name:renamed,name_hu:'Teszt'},true);
 await ok('PUT','/admin/products/'+p.product_id,{...p,category:renamed,stock:2},true);
 await ok('PUT','/admin/categories/'+encodeURIComponent(renamed),{name:renamed+' new'},true);
 assert.equal((await ok('GET','/products/'+p.slug)).category,renamed+' new');checks++;
 assert.equal((await request('DELETE','/admin/categories/'+encodeURIComponent(renamed+' new'),undefined,true)).status,400);checks++;
 await ok('POST','/admin/products/'+p.product_id+'/archive',{},true);
 assert.equal((await request('GET','/products/'+p.slug)).status,404);checks++;
 assert.equal((await request('POST','/newsletter/subscribe',{email:'invalid',consent:true})).status,422);
 assert.equal((await request('POST','/newsletter/subscribe',{email:'test@example.test',consent:false})).status,400);checks++;
 const form=new FormData();form.append('file',new Blob(['<?php echo 1; ?>'],{type:'image/png'}),'bad.png');
 const upload=await fetch(base+'/admin/media/upload',{method:'POST',headers:{'X-Admin-Token':process.env.ADMIN_TOKEN},body:form});assert.equal(upload.status,400);checks++;

 const cp=await ok('POST','/admin/products',{slug:'coupon-'+tag,name:'Kupon teszt',category:cats[0].name,price:10000,stock:20},true);
 const cb={...checkout,items:[{product_id:cp.product_id,quantity:1}]};
 await ok('POST','/admin/coupons',{code:'LIMIT'+tag,type:'percent',value:10,minimum:0,limit:1,active:true},true);
 const code='LIMIT'+tag;
 const preview=await ok('POST','/coupons/validate',{code,items:cb.items});assert.equal(preview.discount,1000);assert.equal(preview.total,10990);
 const discounted=await Promise.all([request('POST','/orders',{...cb,coupon_code:code}),request('POST','/orders',{...cb,coupon_code:code})]);
 assert.deepEqual(discounted.map(x=>x.status).sort(),[200,400]);const did=discounted.find(x=>x.status===200).data.order_id;
 assert.equal((await ok('GET','/orders/'+did)).discount,1000);checks++;
 await ok('PATCH','/admin/orders/'+did+'/status',{fulfillment_status:'CANCELLED'},true);
 assert.equal((await ok('POST','/coupons/validate',{code,items:cb.items})).discount,1000);checks++;
 await ok('POST','/admin/coupons',{code:'OLD'+tag,type:'fixed',value:500,ends_at:'2020-01-01T00:00:00Z'},true);
 assert.equal((await request('POST','/orders',{...cb,coupon_code:'OLD'+tag})).status,400);checks++;
 await ok('POST','/admin/coupons',{code:'MIN'+tag,type:'fixed',value:500,minimum:20000},true);
 assert.equal((await request('POST','/coupons/validate',{code:'MIN'+tag,items:cb.items})).status,400);checks++;
 const options=await ok('GET','/studio');
 const customForm=()=>{const f=new FormData();for(const [k,v]of Object.entries({full_name:'Egyedi Teszt',email:'custom@example.test',scent:options.scents[0],container:options.containers[0],idea:'Halloween stílusú',consent:'1'}))f.append(k,v);return f;};
 let cr=await fetch(base+'/custom-requests',{method:'POST',body:customForm()});assert.equal(cr.status,200);const cid=(await cr.json()).request_id;
 assert.equal((await request('GET','/admin/custom-requests')).status,401);
 const customs=await ok('GET','/admin/custom-requests',undefined,true);assert(customs.some(c=>c.request_id===cid));checks++;
 const bad=customForm();bad.append('image',new Blob(['<?php echo 1; ?>'],{type:'image/png'}),'bad.png');assert.equal((await fetch(base+'/custom-requests',{method:'POST',body:bad})).status,422);checks++;
 const good=customForm();good.append('image',new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lZkAAAAASUVORK5CYII=','base64')],{type:'image/png'}),'plan.png');
 cr=await fetch(base+'/custom-requests',{method:'POST',body:good});assert.equal(cr.status,200);const imageId=(await cr.json()).request_id;
 assert.equal((await fetch(base+'/admin/custom-requests/'+imageId+'/image')).status,401);
 assert.equal((await fetch(base+'/admin/custom-requests/'+imageId+'/image',{headers:{'X-Admin-Token':process.env.ADMIN_TOKEN}})).status,200);checks++;
 assert.equal((await request('POST','/admin/custom-requests/'+cid+'/quote',{amount:0,message:'Teszt ajánlat'},true)).status,422);checks++;
 await ok('POST','/admin/custom-requests/'+cid+'/quote',{amount:5000,message:'Teszt ajánlat, szállítással együtt'},true);
 await ok('PATCH','/admin/custom-requests/'+cid,{status:'PAID'},true);
 assert.equal((await request('POST','/admin/custom-requests/'+cid+'/quote',{amount:6000,message:'Új ajánlat'},true)).status,409);
 const logs=await ok('GET','/admin/emails?order_id='+cid,undefined,true);assert(logs.some(e=>e.event==='custom_quote')); assert(logs.some(e=>e.event==='custom_received'));assert(logs.some(e=>e.event==='admin_custom'));checks++;
 const event=await ok('POST','/admin/events',{title:'Teszt esemény',location:'Debrecen',starts_at:'2027-10-01T10:00:00Z',active:true},true);
 assert((await ok('GET','/events')).some(e=>e.event_id===event.event_id));await ok('PUT','/admin/events/'+event.event_id,{...event,active:false},true);assert(!(await ok('GET','/events')).some(e=>e.event_id===event.event_id));checks++;
 await ok('POST','/admin/categories',{name:'Wax',name_hu:'Régi alapanyag'},true);
 const retired=await ok('POST','/admin/products',{slug:'retired-'+tag,name:'Régi alapanyag',category:'Wax',price:1000,stock:3},true);
 sqlPHP("db()->exec(file_get_contents('backend-php/database/update-studio.sql'));");
 assert.equal((await request('GET','/products/'+retired.slug)).status,404);
 assert.deepEqual((await ok('GET','/categories')).map(c=>c.name),['gyertyak','illatviasz','forma-gyertyak','asztali-disz','egyeb']);
 assert.equal((await ok('GET','/orders/'+paid.order_id)).payment_status,'PAID');checks++;
 console.log(`PASS: ${checks} integration scenarios (including concurrent inventory, signed payments, admin CRUD, upload validation).`);
} catch(e) { console.error(stderr.slice(-4000));throw e; }
finally { try{process.kill(-server.pid,'SIGTERM');}catch{server.kill();} }
