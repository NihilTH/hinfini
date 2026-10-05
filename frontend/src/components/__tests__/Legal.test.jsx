import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {LangProvider} from '@/context/LangContext';
import {legalSections} from '@/pages/Legal';
import BarionPixel from '@/components/BarionPixel';
import {savePrivacy,PRIVACY_KEY} from '@/lib/privacy';
import legal from '@/data/legal.json';
let root,host;
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;localStorage.clear();delete window.barion_pixel_id;delete window.bp;host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();document.querySelectorAll('script[src="https://pixel.barion.com/bp.js"]').forEach(s=>s.remove());});
test('shipping and terms follow checkout configuration in both languages without placeholders',()=>{
 for(const lang of ['hu','en']){const s=JSON.stringify(legalSections('aszf',lang,{shipping_home:2345,free_shipping_from:30000}));expect(s).toContain('2345');expect(s).toContain('30000');expect(s).not.toMatch(/\{shipping|\[SUPPORT|\[CÉG/);expect(s).toContain('91463928-1-29');expect(s).toContain('AAM');}
 expect(legal.pages.elallas.hu[2][1]).toContain('nem feltétele');
});
test('pixel cannot load before opt-in and consent does not load it in admin',async()=>{
 const config={barion_pixel_enabled:true,barion_pixel_id:'BP-1234567890-01'};
 await act(async()=>root.render(<MemoryRouter><LangProvider><BarionPixel config={config}/></LangProvider></MemoryRouter>));
 expect(document.querySelector('script[src="https://pixel.barion.com/bp.js"]')).toBeNull();
 await act(async()=>savePrivacy(false));expect(window.bp).toBeUndefined();
 await act(async()=>savePrivacy(true));expect(document.querySelectorAll('script[src="https://pixel.barion.com/bp.js"]')).toHaveLength(1);
 await act(async()=>root.unmount());root=createRoot(host);document.querySelectorAll('script[src="https://pixel.barion.com/bp.js"]').forEach(s=>s.remove());delete window.barion_pixel_id;delete window.bp;
 await act(async()=>root.render(<MemoryRouter initialEntries={['/admin']}><BarionPixel config={config}/></MemoryRouter>));expect(window.bp).toBeUndefined();
});
test('expired consent cannot load a pixel',async()=>{localStorage.setItem(PRIVACY_KEY,JSON.stringify({optional:true,expires:1}));await act(async()=>root.render(<MemoryRouter><BarionPixel config={{barion_pixel_enabled:true,barion_pixel_id:'BP-1234567890-01'}}/></MemoryRouter>));expect(window.bp).toBeUndefined();});
