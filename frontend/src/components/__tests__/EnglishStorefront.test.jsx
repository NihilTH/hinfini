import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { LangProvider } from '@/context/LangContext';
import { CustomCandles, Events } from '@/pages/Studio';
import api from '@/lib/api';
jest.mock('@/lib/api', () => ({ get: jest.fn() }));
let root, host;
beforeEach(() => {
 global.IS_REACT_ACT_ENVIRONMENT = true;
 localStorage.setItem('hi_lang', 'en');
 host = document.createElement('div'); document.body.append(host); root=createRoot(host);
 api.get.mockImplementation(path=>Promise.resolve({data:path==='/events'?[]:{scents:['Egyeztetést kérek'],containers:['Egyeztetést kérek'],colors:['Piros','Fehér']}}));
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();localStorage.clear();});
const mount=async child=>act(async()=>root.render(<MemoryRouter><LangProvider>{child}</LangProvider></MemoryRouter>));
test('English quote form translates labels and keeps canonical option values',async()=>{
 await mount(<CustomCandles/>);
 expect(host.textContent).toContain('Custom candles');
 expect(host.textContent).toContain('Request a quote');
 expect(host.textContent).toContain('I would like to discuss the options');
 expect(host.textContent).not.toMatch(/Válassz|Küldés|Szöveg|kötelező|Ajánlat/);
 const red=host.querySelector('option[value="Piros"]'); expect(red.textContent).toBe('Red');
 expect(host.querySelector('textarea[placeholder]').placeholder).toBe('Halloween style, with little pumpkin faces');
});
test('English events page has an English empty state',async()=>{
 await mount(<Events/>);
 expect(host.textContent).toContain('There are no upcoming events');
 expect(host.textContent).not.toContain('Események');
});

test('events display their own uncropped image and omit empty images',async()=>{
 api.get.mockResolvedValue({data:[
  {event_id:'a',title:'Vásár',title_en:'Fair',image:'/fair.png',image_alt:'Fair poster'},
  {event_id:'b',title:'Másik',title_en:'Workshop',image:'/workshop.png'},
  {event_id:'c',title:'Kép nélkül',title_en:'No image'}
 ]});
 await mount(<Events/>);
 const images=host.querySelectorAll('article img');
 expect(images).toHaveLength(2);
 expect(images[0].getAttribute('src')).toBe('/fair.png');
 expect(images[0].alt).toBe('Fair poster');
 expect(images[1].getAttribute('src')).toBe('/workshop.png');
 expect(images[1].alt).toBe('Workshop');
 expect(images[0].className).toContain('object-contain');
});
