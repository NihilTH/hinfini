import { cp, mkdir, rm, access } from 'node:fs/promises';
import { resolve, join } from 'node:path';
const root=resolve(import.meta.dirname,'..');
await access(join(root,'frontend/build/index.html'));
const target=join(root,'release');
await rm(target,{recursive:true,force:true});
await mkdir(join(target,'public_html'),{recursive:true});
await cp(join(root,'frontend/build'),join(target,'public_html'),{recursive:true});
await cp(join(root,'deploy/cpanel'),join(target,'public_html'),{recursive:true});
await cp(join(root,'backend-php'),join(target,'backend-php'),{recursive:true,filter:src=>!src.endsWith('config.local.php')&&!src.includes('/uploads')&&!src.includes('/tests')});
await cp(join(root,'DEPLOY-CPANEL.md'),join(target,'TELEPITES.md'));
console.log('cPanel package ready: release/public_html + release/backend-php');

for (const name of ["TERMEKFELTOLTES.md", "HTTPS-LEPESEK.md"]) await cp(join(root,name),join(target,name));
const update=join(root,"release-update");
await rm(update,{recursive:true,force:true});
await mkdir(join(update,"public_html"),{recursive:true});
await cp(join(root,"frontend/build"),join(update,"public_html"),{recursive:true});
