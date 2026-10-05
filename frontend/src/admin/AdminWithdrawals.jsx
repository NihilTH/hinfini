import {useEffect,useState} from 'react';
import {useLang} from '@/context/LangContext';
import {adminApi} from '@/admin/adminApi';
export default function AdminWithdrawals(){const {lang}=useLang();const hu=lang==='hu';const [items,setItems]=useState([]);const [error,setError]=useState(false);
useEffect(()=>{adminApi.withdrawals().then(r=>setItems(r.data.reverse())).catch(()=>setError(true));},[]);
return <div><p className="text-[#B8AE95] mb-5">{hu?'Az elállási bejelentés nem indít automatikus visszatérítést. Ellenőrizd a rendelést, intézd a visszafizetést és szükség esetén a számla módosítását. Az e-mail naplóban ellenőrizd a visszaigazolást.':'A withdrawal notice does not trigger an automatic refund. Check the order, arrange reimbursement and amend the invoice where necessary. Check the acknowledgement in the email log.'}</p>{error&&<p role="alert">{hu?'Nem sikerült betölteni.':'Could not load.'}</p>}{items.map(d=><article key={d.key} className="admin-card p-5 mb-4"><h2 className="text-[#D4AF6E] break-all">{d.key}</h2><p>{d.received_at}</p><pre className="whitespace-pre-wrap break-words font-sans mt-3">{d.statement}</pre></article>)}</div>}
