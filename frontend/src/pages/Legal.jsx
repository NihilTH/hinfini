import { Link, useParams } from 'react-router-dom';
import { useLang } from '@/context/LangContext';
import { useCatalog } from '@/context/CatalogContext';
import Seo from '@/components/Seo';
import CookieChoices from '@/components/CookieChoices';
import WithdrawalForm from '@/components/WithdrawalForm';
import legal from '@/data/legal.json';
export function legalSections(page,lang,config){return (legal.pages[page]?.[lang]||[]).map(([h,b])=>[h,b.replaceAll('{shipping_home}',String(config.shipping_home)).replaceAll('{free_shipping_from}',String(config.free_shipping_from))]);}
function Body({text}){return text.split(/(https:\/\/[^\s;]+|[\w.+-]+@[\w.-]+\.[a-z]{2,})/g).map((part,i)=>/^https:\/\//.test(part)?<a key={i} className="underline break-words" href={part.replace(/[.,]$/,'')}>{part}</a>:/^[\w.+-]+@/.test(part)?<a key={i} className="underline break-words" href={`mailto:${part}`}>{part}</a>:part);}
export default function Legal(){
 const {page}=useParams();const {lang,t}=useLang();const {config}=useCatalog();const data=legal.pages[page];
 if(!data)return <div className="p-16 text-center">{t('err.notFound')}</div>;
 const sections=legalSections(page,lang,config);
 return <article data-testid={`legal-${page}`} className="max-w-3xl mx-auto px-6 py-16"><Seo title={t(data.key)} description={sections[0]?.[1]}/><div className="overline mb-4">{t('footer.info')}</div><h1 className="font-serif-display text-4xl md:text-6xl">{t(data.key)}</h1>
 <p className="text-sm text-[#B8AE95] mt-5">{lang==='hu'?'Tájékoztató verziója: ':'Information version: '}{legal.version}</p><button onClick={()=>window.print()} className="btn-outline mt-4 print:hidden">{lang==='hu'?'Nyomtatás / mentés PDF-ként':'Print / save as PDF'}</button>
 <div className="mt-12 space-y-10">{sections.map(([h,b])=><section key={h}><h2 className="font-serif-display text-2xl mb-3">{h}</h2><p className="text-[#B8AE95] leading-relaxed whitespace-pre-line"><Body text={b}/></p></section>)}</div>
 {page==='elallas'&&<WithdrawalForm/>}{page==='sutik'&&<CookieChoices settings config={config}/>}
 <nav className="mt-12 pt-8 border-t border-[#3d3835] flex flex-wrap gap-5" aria-label={t('footer.info')}>{Object.entries(legal.pages).filter(([key])=>key!==page).map(([key,p])=><Link key={key} to={`/${key}`} className="underline text-[#D4AF6E] focus-ring">{t(p.key)}</Link>)}</nav></article>;
}
