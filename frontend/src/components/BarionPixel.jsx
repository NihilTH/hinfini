import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';
// Base fraud-prevention pixel only. No marketing consent or Full Pixel events are sent.
export default function BarionPixel({config}) {
  const {pathname}=useLocation();
  useEffect(()=>{
    const id=config.barion_pixel_id;
    if(!config.barion_pixel_enabled||!/^BP-[a-zA-Z0-9]{10}-[0-9]{2}$/.test(id||'')||/^\/(admin|order)(\/|$)/.test(pathname))return;
    if(window.barion_pixel_id===id)return;
    window.bp=window.bp||function(){(window.bp.q=window.bp.q||[]).push(arguments);};
    window.bp.l=Date.now();window.barion_pixel_id=id;
    const script=document.createElement('script');script.async=true;script.src='https://pixel.barion.com/bp.js';document.head.appendChild(script);
    window.bp('init','addBarionPixelId',id);
  },[config.barion_pixel_enabled,config.barion_pixel_id,pathname]);
  return null;
}
