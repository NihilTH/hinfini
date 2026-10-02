import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import Seo from "@/components/Seo";
import { useLang } from "@/context/LangContext";
const cls="admin-input !py-3";
function Page({title,children}) {return <div className="max-w-4xl mx-auto px-6 py-16"><Seo title={title}/><h1 className="font-serif-display text-4xl sm:text-5xl mb-8">{title}</h1>{children}</div>;}
export function About(){const {t}=useLang();return <Page title={t('nav.about')}><img src="/hinfini-logo.png" alt="H’INFINI Candles" className="w-48 h-48 rounded-full mx-auto mb-8"/><div className="space-y-6 text-lg text-[#B8AE95] leading-relaxed"><p>{t('brand.p1')}</p><p>{t('brand.p2')}</p><Link className="btn-primary" to="/egyedi-gyertyak">{t('nav.custom')}</Link></div></Page>;}
export function Events(){const {lang,tr}=useLang();const s=value=>lang==="en"?(studioEnglish[value]||value):value;const [items,setItems]=useState(null);const [error,setError]=useState(false);useEffect(()=>{api.get('/events').then(r=>setItems(r.data)).catch(()=>setError(true));},[]);return <Page title={s("Események")}>{error?<p>{s("Az események most nem tölthetők be. Frissítsd az oldalt.")}</p>:items===null?<p>{s("Betöltés…")}</p>:items.length===0?<p className="text-[#B8AE95]">{s("Jelenleg nincs meghirdetett eseményünk. Nézz vissza később!")}</p>:<div className="space-y-6">{items.map(e=><article key={e.event_id} className="admin-card p-6"><h2 className="font-serif-display text-3xl">{tr(e,"title")}</h2><p className="text-[#D4AF6E] my-3">{new Date(e.starts_at).toLocaleString(lang === 'en' ? 'en-GB' : 'hu-HU',{timeZone:'Europe/Budapest'})} · {e.location}</p><p className="whitespace-pre-wrap">{tr(e,"description")}</p></article>)}</div>}</Page>;}
export function CustomCandles(){
 const {lang,label}=useLang();const s=value=>lang==="en"?(studioEnglish[value]||studioEnglish["Az elküldés nem sikerült. Próbáld újra."]):value;
 const [options,setOptions]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[sent,setSent]=useState(null),[image,setImage]=useState(null),[focused,setFocused]=useState(false);
 const [form,setForm]=useState({full_name:'',email:'',phone:'',scent:'',container:'',text:'',color:'',idea:'',website:'',consent:false});
 useEffect(()=>{api.get('/studio').then(r=>setOptions(r.data)).catch(()=>setError("A lehetőségek nem tölthetők be. Frissítsd az oldalt."));},[]);
 const change=k=>e=>setForm({...form,[k]:e.target.type==='checkbox'?e.target.checked:e.target.value});
 const submit=async e=>{e.preventDefault();setBusy(true);setError('');try{const data=new FormData();Object.entries(form).forEach(([k,v])=>data.append(k,k==='consent'?(v?'1':'0'):v));if(image)data.append('image',image);const r=await api.post('/custom-requests',data);setSent(r.data);}catch(e){setError(e.response?.data?.detail||"Az elküldés nem sikerült. Próbáld újra.");}finally{setBusy(false);}};
 return <Page title={s("Egyedi gyertyák")}>{sent?<div role="status" className="admin-card p-8"><h2 className="text-2xl mb-4">{s("Köszönjük az ajánlatkérést!")}</h2><p>{s(sent.message)}</p><p className="mt-4 text-sm break-all">{lang === "en" ? "Reference" : "Azonosító"}: {sent.request_id}</p></div>:<><p className="text-lg text-[#B8AE95] mb-8">{s("Mondd el, milyen gyertyát szeretnél! Személyre szabott ajánlatot küldünk e-mailben. Elfogadás után kizárólag átutalással fizethetsz; az ajánlatkérés még nem jár fizetési kötelezettséggel.")}</p>{error&&<p role="alert" className="mb-6 text-red-300">{s(error)}</p>}{options&&<form onSubmit={submit} className="space-y-6">
 <div className="grid sm:grid-cols-2 gap-6">{[['full_name',s("Név"),'text'],['email',s("E-mail-cím"),'email'],['phone',s("Telefonszám (nem kötelező)"),'tel']].map(([k,l,type])=><label key={k} className="block">{l}<input className={cls} type={type} required={k!=='phone'} maxLength={250} value={form[k]} onChange={change(k)}/></label>)}</div>
 <div className="grid sm:grid-cols-2 gap-6">{[['scent',s("Illat"),'scents'],['container',s("Tartó"),'containers']].map(([k,l,o])=><label key={k}>{l}<select required className={cls} value={form[k]} onChange={change(k)}><option value="">{s("Válassz…")}</option>{options[o].map(v=><option key={v} value={v}>{label(v)}</option>)}</select></label>)}</div>
 <label className="block">{s("A gyertyára kért szöveg")}<textarea rows={3} maxLength={1000} className={cls} value={form.text} onChange={change('text')}/></label>
 <label className="block">{s("Kép feltöltése (nem kötelező)")}<input type="file" accept="image/jpeg,image/png,image/webp" className="block mt-3 w-full" onChange={e=>{const f=e.target.files[0];if(f&&f.size>5*1024*1024){setError("A kép legfeljebb 5 MB lehet.");e.target.value='';setImage(null);}else{setImage(f||null);setError('');}}}/><span className="text-sm text-[#B8AE95]">{s("JPG, PNG vagy WebP; legfeljebb 5 MB. A képet csak mi látjuk az ajánlatkéréshez.")}</span></label>
 {!image&&<label className="block">{s("Szöveg színe")}<select required={!!form.text} className={cls} value={form.color} onChange={change('color')}><option value="">{s("Válassz…")}</option>{options.colors.map(v=><option key={v} value={v}>{label(v)}</option>)}</select></label>}
 <label className="block">{s("Egyedi elképzelés")}<textarea rows={5} maxLength={5000} className={cls} value={form.idea} onChange={change('idea')} placeholder={focused?'':s("Halloween stílusú, kicsi tök fejekkel")} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}/></label>
 <div hidden aria-hidden="true"><input tabIndex={-1} autoComplete="off" value={form.website} onChange={change('website')}/></div>
 <label className="flex gap-3"><input type="checkbox" required checked={form.consent} onChange={change('consent')}/><span>{lang === "en" ? "I consent to my information and image being processed for this quote request in accordance with the " : "Hozzájárulok az ajánlatkéréshez megadott adataim és képem kezeléséhez az "}<Link to="/adatkezeles" target="_blank" className="underline">{s("adatkezelési tájékoztató")}</Link>{lang === "en" ? "." : " szerint."}</span></label>
 <button className="btn-primary" disabled={busy}>{busy?s("Küldés…"):s("Ajánlatot kérek")}</button></form>}</>}</Page>;
}

const studioEnglish = {
  "Események": "Events",
  "Az események most nem tölthetők be. Frissítsd az oldalt.": "Events could not be loaded. Please refresh the page.",
  "Betöltés…": "Loading…",
  "Jelenleg nincs meghirdetett eseményünk. Nézz vissza később!": "There are no upcoming events at the moment. Check back later!",
  "Egyedi gyertyák": "Custom candles",
  "A lehetőségek nem tölthetők be. Frissítsd az oldalt.": "The options could not be loaded. Please refresh the page.",
  "Az elküldés nem sikerült. Próbáld újra.": "Your request could not be sent. Please try again.",
  "Köszönjük az ajánlatkérést!": "Thank you for requesting a quote!",
  "Mondd el, milyen gyertyát szeretnél! Személyre szabott ajánlatot küldünk e-mailben. Elfogadás után kizárólag átutalással fizethetsz; az ajánlatkérés még nem jár fizetési kötelezettséggel.": "Tell us about the candle you would like! We will email you a personalised quote. Once you accept it, payment is by bank transfer only; requesting a quote does not commit you to a payment.",
  "Név": "Name",
  "E-mail-cím": "Email address",
  "Telefonszám (nem kötelező)": "Phone number (optional)",
  "Illat": "Scent",
  "Tartó": "Container",
  "Válassz…": "Choose…",
  "A gyertyára kért szöveg": "Text to appear on the candle",
  "Kép feltöltése (nem kötelező)": "Upload an image (optional)",
  "A kép legfeljebb 5 MB lehet.": "The image must be no larger than 5 MB.",
  "JPG, PNG vagy WebP; legfeljebb 5 MB. A képet csak mi látjuk az ajánlatkéréshez.": "JPG, PNG or WebP; up to 5 MB. Only we can see the image, for the purpose of your quote request.",
  "Szöveg színe": "Text colour",
  "Egyedi elképzelés": "Your own idea",
  "Halloween stílusú, kicsi tök fejekkel": "Halloween style, with little pumpkin faces",
  "adatkezelési tájékoztató": "Privacy Policy",
  "Küldés…": "Sending…",
  "Ajánlatot kérek": "Request a quote",
  "Megkaptuk az ajánlatkérésedet. Az egyedi ajánlatot e-mailben küldjük; fizetni majd átutalással tudsz.": "We have received your request. We will email you a personalised quote; you can then pay by bank transfer.",
  "Az adatkezelési hozzájárulás szükséges.": "Please consent to the processing of your information.",
  "Válassz az elérhető lehetőségek közül.": "Please choose one of the available options.",
  "Válassz szövegszínt.": "Please choose a text colour.",
  "Adj meg szöveget, képet vagy egyedi elképzelést.": "Please provide text, an image or your own idea.",
  "Túl sok kérés. Próbáld később.": "Too many requests. Please try again later.",
  "JPG, PNG vagy WebP képet válassz, legfeljebb 25 megapixellel.": "Choose a JPG, PNG or WebP image of no more than 25 megapixels."
};
