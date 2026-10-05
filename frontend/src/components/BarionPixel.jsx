import {useEffect,useState} from 'react';
import {useLocation} from 'react-router-dom';
import {privacyChoice} from '@/lib/privacy';
export default function BarionPixel({config}) {
  const {pathname}=useLocation();const [choice,setChoice]=useState(privacyChoice);
  useEffect(()=>{const update=e=>setChoice(e.detail);window.addEventListener('privacy-choice',update);return()=>window.removeEventListener('privacy-choice',update);},[]);
  useEffect(()=>{
    const id=config.barion_pixel_id;
    if(!choice?.optional||choice.expires<=Date.now()||!config.barion_pixel_enabled||!/^BP-[a-zA-Z0-9]{10}-[0-9]{2}$/.test(id||'')||/^\/(admin|order)(\/|$)/.test(pathname))return;
    if(window.barion_pixel_id===id)return;
    window.bp=window.bp||function(){(window.bp.q=window.bp.q||[]).push(arguments);};
    window.bp.l=Date.now();window.barion_pixel_id=id;
    const script=document.createElement('script');script.async=true;script.src='https://pixel.barion.com/bp.js';document.head.appendChild(script);
    window.bp('init','addBarionPixelId',id);
  },[config.barion_pixel_enabled,config.barion_pixel_id,pathname,choice]);
  return null;
}
