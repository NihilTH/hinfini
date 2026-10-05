import {useEffect,useState} from 'react';
import {Link,useLocation} from 'react-router-dom';
import {useLang} from '@/context/LangContext';
import {privacyChoice,savePrivacy} from '@/lib/privacy';
export default function CookieChoices({config,settings=false}) {
  const {lang}=useLang();const hu=lang==='hu';const {pathname}=useLocation();
  const [choice,setChoice]=useState(privacyChoice);
  useEffect(()=>{const update=e=>setChoice(e.detail);window.addEventListener('privacy-choice',update);return()=>window.removeEventListener('privacy-choice',update);},[]);
  if(!settings&&(!config.barion_pixel_enabled||choice||pathname.startsWith('/admin')))return null;
  return <section aria-label={hu?'Süti beállítások':'Cookie settings'} className={settings?'mt-8 border border-[#3d3835] p-6':'fixed bottom-0 inset-x-0 z-[80] bg-[#24221E] border-t border-[#D4AF6E] p-5 shadow-xl'}>
    <div className="max-w-4xl mx-auto"><h2 className="font-serif-display text-2xl">{hu?'Süti beállítások':'Cookie settings'}</h2>
    <p className="text-sm text-[#B8AE95] my-3">{hu?'A kosárhoz és a nyelvválasztáshoz szükséges tároláson kívül csak az engedélyeddel töltjük be az opcionális Barion Pixelt.':'Beyond storage needed for your basket and language, the optional Barion Pixel loads only with your permission.'} <Link to="/sutik" className="underline">{hu?'Részletek':'Details'}</Link></p>
    {settings&&<p className="text-sm mb-3" role="status">{hu?'Jelenlegi választás: ':'Current choice: '}{choice?.optional?(hu?'opcionális pixel engedélyezve':'optional pixel allowed'):(hu?'csak szükséges':'necessary only')}{!config.barion_pixel_enabled&&(hu?' · A pixel jelenleg nincs bekapcsolva.':' · The pixel is currently disabled.')}</p>}
    <div className="flex flex-wrap gap-3"><button className="btn-outline focus-ring" onClick={()=>savePrivacy(false)}>{hu?'Csak szükséges':'Necessary only'}</button><button className="btn-outline focus-ring" onClick={()=>savePrivacy(true)}>{hu?'Opcionális pixel engedélyezése':'Allow optional pixel'}</button></div></div>
  </section>;
}
