import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
for(const root of ['release','release-update']) {
 const html=await readFile(`${root}/public_html/index.html`,'utf8');
 assert(!/posthog|assets\.emergent\.sh|ap\.emergent\.sh/i.test(html),'Unexpected tracking script');
 assert(html.includes('name="referrer" content="no-referrer"'),'Missing referrer policy');
 assert((await readFile(`${root}/backend-php/.htaccess`,'utf8')).includes('Require all denied'));
 async function check(dir,relative='') {
  for(const entry of await readdir(dir,{withFileTypes:true})) {
   const file=relative+entry.name;
   if(entry.isDirectory()) { assert(['src','bin','database'].includes(file)); await check(`${dir}/${entry.name}`,file+'/'); }
   else assert(['.htaccess','config.example.php','http.php','router.php'].includes(file)||/^(src|bin)\/[\w-]+\.php$/.test(file)||/^database\/[\w-]+\.(sql|json)$/.test(file),`Unexpected private package file: ${file}`);
  }
 }
 await check(`${root}/backend-php`);
}
console.log('Release privacy checks passed');
