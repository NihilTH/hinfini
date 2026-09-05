import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash } from "@phosphor-icons/react";
import { adminApi, useA, errText, fmtDate } from "@/admin/adminApi";
import { Confirm, Badge } from "@/admin/ui";

export function AdminNewsletter() {
  const a = useA();
  const [items, setItems] = useState([]);
  const [del, setDel] = useState(null);
  const load = useCallback(() => adminApi.newsletter().then(({ data }) => setItems(data)).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);
  const remove = async () => { try { await adminApi.deleteSubscriber(del.email); toast.success(a("saved")); setDel(null); load(); } catch (e) { toast.error(errText(e, a)); } };
  return (
    <div data-testid="admin-newsletter">
      <p className="text-sm text-[#B8AE95] mb-4">{a("subscribers")}: <strong className="text-[#D4AF6E]" data-testid="nl-count">{items.length}</strong></p>
      <div className="admin-card overflow-x-auto">
        <table className="w-full text-sm min-w-[520px]">
          <thead className="text-[10px] uppercase tracking-widest text-[#B8AE95] bg-[#1A1917]"><tr><th className="p-3 text-left">E-mail</th><th className="p-3 text-left">{a("consentedAt")}</th><th className="p-3 text-left">{a("source")}</th><th className="p-3 text-left">HU/EN</th><th className="p-3"></th></tr></thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.email} className="border-t border-[#3d3835]" data-testid={`nl-row-${s.email}`}>
                <td className="p-3">{s.email}</td><td className="p-3 text-[#B8AE95]">{fmtDate(s.consented_at)}</td><td className="p-3 text-[#B8AE95]">{s.source}</td><td className="p-3 uppercase text-[#B8AE95]">{s.lang}</td>
                <td className="p-3 text-right"><button onClick={() => setDel(s)} aria-label={a("removeSub")} className="w-8 h-8 inline-flex items-center justify-center border border-[#3d3835] hover:border-[#B0413E] focus-ring" data-testid={`nl-del-${s.email}`}><Trash size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-6 text-sm text-[#B8AE95] text-center">{a("noSubs")}</p>}
      </div>
      {del && <Confirm message={a("removeSubConfirm")} danger onNo={() => setDel(null)} onYes={remove} testId="nl-del-confirm" />}
    </div>
  );
}

export function AdminEmailLog({ provider }) {
  const a = useA();
  const [items, setItems] = useState([]);
  const [resend, setResend] = useState(null);
  const load = useCallback(() => adminApi.emails().then(({ data }) => setItems(data)).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);
  const doResend = async () => {
    try { const { data } = await adminApi.resendEmail(resend.log_id); toast[data.status === "FAILED" ? "error" : "success"](`${a("resend")}: ${a("es_" + data.status)}`); setResend(null); load(); }
    catch (e) { toast.error(errText(e, a)); setResend(null); }
  };
  return (
    <div data-testid="admin-emails">
      <p className="admin-help mb-4">{a("providerNote", { p: provider || "none" })}</p>
      <div className="admin-card overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]" data-testid="el-table">
          <thead className="text-[10px] uppercase tracking-widest text-[#B8AE95] bg-[#1A1917]"><tr><th className="p-3 text-left">{a("orderId")}</th><th className="p-3 text-left">{a("event")}</th><th className="p-3 text-left">{a("recipient")}</th><th className="p-3 text-left">{a("subject")}</th><th className="p-3 text-left">{a("status")}</th><th className="p-3 text-left">{a("sentAt")}</th><th className="p-3"></th></tr></thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.log_id} className="border-t border-[#3d3835]" data-testid={`el-row-${e.log_id}`}>
                <td className="p-3 font-mono text-xs">{e.order_id || "-"}</td><td className="p-3">{e.event}</td><td className="p-3 text-[#B8AE95]">{e.recipient}</td><td className="p-3 text-[#B8AE95] max-w-[260px] truncate" title={e.subject}>{e.subject}</td>
                <td className="p-3"><Badge value={e.status} label={a("es_" + e.status)} />{e.error && <div className="text-[10px] text-[#8a826f] mt-1 max-w-[200px] truncate" title={e.error}>{e.error}</div>}</td>
                <td className="p-3 text-[#B8AE95] whitespace-nowrap">{fmtDate(e.created_at)}</td>
                <td className="p-3 text-right">{e.order_id && <button onClick={() => setResend(e)} className="btn-outline !py-1 !px-3 text-xs focus-ring" data-testid={`el-resend-${e.log_id}`}>{a("resend")}</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-6 text-sm text-[#B8AE95] text-center">—</p>}
      </div>
      {resend && <Confirm message={a("resendConfirm")} onNo={() => setResend(null)} onYes={doResend} testId="el-resend-confirm" />}
    </div>
  );
}
