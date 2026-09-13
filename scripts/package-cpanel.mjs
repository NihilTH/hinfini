import { cp, mkdir, rm, access } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
const root=resolve(import.meta.dirname,'..');
await access(join(root,'frontend/build/index.html'));
const target=join(root,'release');
await rm(target,{recursive:true,force:true});
await mkdir(join(target,'public_html'),{recursive:true});
await cp(join(root,'frontend/build'),join(target,'public_html'),{recursive:true});
await cp(join(root,'deploy/cpanel'),join(target,'public_html'),{recursive:true});
await cp(join(root,'backend-php'),join(target,'backend-php'),{recursive:true,filter:src=>{
  const file=relative(join(root,'backend-php'),src).replaceAll('\\','/');
  if(file==='')return true;
  if(['.htaccess','config.example.php','http.php','router.php','src','bin','database'].includes(file))return true;
  return /^(src|bin)\/[a-zA-Z0-9_-]+\.php$/.test(file)||/^database\/[a-zA-Z0-9_-]+\.(sql|json)$/.test(file);
}});
await cp(join(root,'DEPLOY-CPANEL.md'),join(target,'TELEPITES.md'));
console.log('cPanel package ready: release/public_html + release/backend-php');

for (const name of ["TERMEKFELTOLTES.md", "HTTPS-LEPESEK.md"]) await cp(join(root,name),join(target,name));
const update=join(root,"release-update");
await rm(update,{recursive:true,force:true});
await mkdir(join(update,"public_html"),{recursive:true});
await cp(join(root,"frontend/build"),join(update,"public_html"),{recursive:true});

// This release changes both API and schema; provide a complete safe update.
await cp(join(target,'backend-php'),join(update,'backend-php'),{recursive:true});
await cp(join(root,'FRISSITES-STUDIO.md'),join(update,'FRISSITES.md'));
await cp(join(root,'FRISSITES-STUDIO.md'),join(target,'FRISSITES.md'));
await cp(join(root,'BEALLITAS-ES-HASZNALAT.md'),join(update,'BEALLITAS-ES-HASZNALAT.md'));
await cp(join(root,'BEALLITAS-ES-HASZNALAT.md'),join(target,'BEALLITAS-ES-HASZNALAT.md'));
await cp(join(root,'SECURITY-REVIEW.md'),join(update,'SECURITY-REVIEW.md'));
await cp(join(root,'SECURITY-REVIEW.md'),join(target,'SECURITY-REVIEW.md'));
