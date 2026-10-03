import { useEffect, useState } from 'react';
import { adminApi } from '@/admin/adminApi';
import { useLang } from '@/context/LangContext';
import { ImagePickerModal } from '@/admin/Media';
import SmartImage from '@/components/SmartImage';

const DEFAULT = '/hero-candle-pouring.webp';
export default function AdminHomepage() {
  const { lang } = useLang();
  const en = lang === 'en';
  const [form, setForm] = useState(null);
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);
  const load = () => { setError(false); adminApi.homepage().then(({data})=>setForm(data)).catch(()=>setError(true)); };
  useEffect(load, []);
  const change = patch => { setForm(old=>({...old,...patch})); setSaved(false); setError(false); };
  const save = async () => {
    setBusy(true); setSaved(false); setError(false);
    try { const {data}=await adminApi.saveHomepage(form); setForm(data); setSaved(true); }
    catch { setError(true); }
    finally { setBusy(false); }
  };
  return <div className="admin-card p-5 sm:p-8 max-w-4xl space-y-6" data-testid="admin-homepage">
    <h2 className="font-serif-display text-3xl">{en?'Home page image':'Főoldali kép'}</h2>
    <p className="text-[#B8AE95]">{en?'Choose an image from the media library or upload a new one there, then save. This replaces the large image next to the logo on the home page.':'Válassz képet a médiatárból, vagy tölts fel ott egy újat, majd mentsd el. Ezzel a főoldalon a logó melletti nagy képet cseréled le.'}</p>
    {error && <div role="alert" className="text-red-300">{en?'The operation failed. Please try again. If you have just updated the site, also upload the backend-php folder.':'A művelet nem sikerült. Próbáld újra. Ha most frissítetted az oldalt, a backend-php mappát is töltsd fel.'}{!form&&<button onClick={load} className="btn-outline ml-3">{en?'Retry':'Újrapróbálás'}</button>}</div>}
    {!form&&!error&&<p>{en?'Loading…':'Betöltés…'}</p>}
    {form&&<>
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div className="aspect-[4/5] bg-[#24221E] border border-[#3d3835] overflow-hidden"><SmartImage key={form.image} src={form.image||DEFAULT} alt={en?form.alt_en:form.alt} className="w-full h-full object-contain" /></div>
        <div className="space-y-5">
          <button type="button" disabled={busy} onClick={()=>setPicker(true)} className="btn-outline" data-testid="homepage-pick">{en?'Choose / upload image':'Kép kiválasztása / feltöltése'}</button>
          <p className="admin-help">{en?'JPG, PNG, WebP or GIF, up to 5 MB. Portrait images work best. The whole image is displayed without cropping.':'JPG, PNG, WebP vagy GIF, legfeljebb 5 MB. Az álló képek illenek ide legjobban. A kép teljes egészében, levágás nélkül jelenik meg.'}</p>
          <label className="block"><span className="admin-label">{en?'Image description (Hungarian)':'Kép leírása (magyar)'}</span><input disabled={busy} className="admin-input" maxLength={500} value={form.alt} onChange={e=>change({alt:e.target.value})}/></label>
          <label className="block"><span className="admin-label">{en?'Image description (English)':'Kép leírása (angol)'}</span><input disabled={busy} className="admin-input" maxLength={500} value={form.alt_en} onChange={e=>change({alt_en:e.target.value})}/></label>
          <button type="button" disabled={busy} className="text-sm underline text-[#B8AE95]" onClick={()=>change({media_id:'',image:DEFAULT,alt:'Gyertyaöntés fekete-arany üvegtégelybe',alt_en:'Candle pouring into a black and gold glass container'})}>{en?'Restore default image':'Alapértelmezett kép visszaállítása'}</button>
        </div>
      </div>
      <button type="button" disabled={busy} onClick={save} className="btn-primary disabled:opacity-50" data-testid="homepage-save">{busy?(en?'Saving…':'Mentés…'):(en?'Save home page image':'Főoldali kép mentése')}</button>
      {saved&&<p role="status" className="text-[#D4AF6E]">{en?'Saved. The new image will appear when you open or refresh the home page.':'Mentve. Az új kép a főoldal megnyitásakor vagy frissítésekor megjelenik.'}</p>}
    </>}
    {picker&&<ImagePickerModal onClose={()=>setPicker(false)} onPick={m=>change({media_id:m.media_id,image:m.url,alt:m.alt||'',alt_en:''})}/>}
  </div>;
}
