import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowsClockwise } from "@phosphor-icons/react";
import { adminApi, useA, errText, fmtDate } from "@/admin/adminApi";
import { Modal, Confirm, Field, Section, Badge } from "@/admin/ui";
import { formatPrice } from "@/context/LangContext";

const FS = ["NEW", "AWAITING_PAYMENT", "PAID", "PACKING", "SHIPPED", "COMPLETED", "CANCELLED"];

export default function AdminOrders({ initialOrder, onChanged }) {
  const a = useA();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState(null);

  const load = useCallback(() => adminApi.orders({ q: q || undefined, status: status || undefined }).then(({ data }) => setItems(data)).catch(() => {}), [q, status]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (initialOrder) setOpen(initialOrder); }, [initialOrder]);

  return (
    <div data-testid="admin-orders">
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`${a("search")} (#ord, ${a("customer").toLowerCase()}, e-mail)`} aria-label={a("search")} className="admin-input sm:max-w-sm" data-testid="ao-search" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label={a("fulfillment")} className="admin-input sm:w-56" data-testid="ao-filter-status"><option value="">{a("all")}</option>{FS.map((s) => <option key={s} value={s}>{a("fs_" + s)}</option>)}</select>
        <button onClick={load} className="btn-outline !py-2 !px-4 text-sm focus-ring" aria-label="Frissítés" data-testid="ao-refresh"><ArrowsClockwise size={16} /></button>
      </div>
      <p className="admin-help mb-3">{a("noDelete")}</p>
      <div className="admin-card overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]" data-testid="ao-table">
          <thead className="text-[10px] uppercase tracking-widest text-[#B8AE95] bg-[#1A1917]"><tr><th className="p-3 text-left">{a("orderId")}</th><th className="p-3 text-left">{a("date")}</th><th className="p-3 text-left">{a("customer")}</th><th className="p-3 text-right">{a("total")}</th><th className="p-3 text-left">{a("payment")}</th><th className="p-3 text-left">{a("fulfillment")}</th><th className="p-3"></th></tr></thead>
          <tbody>
            {items.map((o) => (
              <tr key={o.order_id} className="border-t border-[#3d3835] hover:bg-[#1A1917]/50" data-testid={`order-row-${o.order_id}`}>
                <td className="p-3 font-mono text-xs">{o.order_id}</td>
                <td className="p-3 text-[#B8AE95] whitespace-nowrap">{fmtDate(o.created_at)}</td>
                <td className="p-3">{o.full_name}<div className="text-[11px] text-[#8a826f]">{o.email}</div></td>
                <td className="p-3 text-right text-[#D4AF6E]">{formatPrice(o.total)}</td>
                <td className="p-3"><Badge value={o.payment_status} label={a("ps_" + o.payment_status)} /></td>
                <td className="p-3"><Badge value={o.fulfillment_status} label={a("fs_" + o.fulfillment_status)} testId={`order-fs-${o.order_id}`} /></td>
                <td className="p-3 text-right"><button onClick={() => setOpen(o.order_id)} className="btn-outline !py-1.5 !px-3 text-xs focus-ring" data-testid={`order-open-${o.order_id}`}>{a("details")}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="p-6 text-sm text-[#B8AE95] text-center">{a("noOrders")}</p>}
      </div>
      {open && <OrderDetail orderId={open} onClose={() => setOpen(null)} onChanged={() => { load(); onChanged?.(); }} />}
    </div>
  );
}

function OrderDetail({ orderId, onClose, onChanged }) {
  const a = useA();
  const [o, setO] = useState(null);
  const [fs, setFs] = useState("");
  const [tr, setTr] = useState({ tracking_carrier: "", tracking_number: "", tracking_url: "", tracking_eta: "" });
  const [note, setNote] = useState("");
  const [inv, setInv] = useState({ status: "NONE", number: "", url: "" });
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [resend, setResend] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => adminApi.order(orderId).then(({ data }) => {
    setO(data); setFs(data.fulfillment_status); setNote(data.admin_note || "");
    setTr({ tracking_carrier: data.tracking?.carrier || "", tracking_number: data.tracking?.number || "", tracking_url: data.tracking?.url || "", tracking_eta: data.tracking?.eta || "" });
    setInv({ status: data.invoice?.status || "NONE", number: data.invoice?.number || "", url: data.invoice?.url || "" });
  }).catch(() => toast.error(a("failed"))), [orderId, a]);
  useEffect(() => { load(); }, [load]);

  const saveStatus = async () => {
    setBusy(true);
    try { await adminApi.orderStatus(orderId, { fulfillment_status: fs, admin_note: note, ...tr }); toast.success(a("saved")); load(); onChanged(); }
    catch (e) { toast.error(errText(e, a)); } finally { setBusy(false); setConfirmCancel(false); }
  };
  const saveInvoice = async () => {
    try { await adminApi.orderInvoice(orderId, inv); toast.success(a("saved")); load(); } catch (e) { toast.error(errText(e, a)); }
  };
  const doResend = async () => {
    try { const { data } = await adminApi.resendEmail(resend.log_id); toast[data.status === "FAILED" ? "error" : "success"](`${a("resend")}: ${a("es_" + data.status)}`); setResend(null); load(); }
    catch (e) { toast.error(errText(e, a)); setResend(null); }
  };

  if (!o) return null;
  return (
    <Modal title={`${a("orderId")} ${o.order_id}`} onClose={onClose} wide testId="order-detail">
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {o.payment_review_required && <p role="alert" className="border border-[#D4AF6E] p-4 text-[#D4AF6E]">{a("paymentReview")}</p>}
          <Section title={a("items")}>
            <table className="w-full text-sm"><tbody>
              {o.items.map((i) => <tr key={i.product_id} className="border-b border-[#3d3835]"><td className="py-2">{i.name}</td><td className="py-2 text-[#B8AE95] text-right whitespace-nowrap">{i.quantity} × {formatPrice(i.price)}</td><td className="py-2 text-right whitespace-nowrap">{formatPrice(i.line_total)}</td></tr>)}
              <tr><td className="pt-3 text-[#B8AE95]">{a("shipping")} ({o.shipping_method === "pickup" ? "Csomagpont" : "Házhozszállítás"})</td><td></td><td className="pt-3 text-right">{o.shipping === 0 ? "0 Ft" : formatPrice(o.shipping)}</td></tr>
              <tr><td className="pt-2 font-serif-display text-lg">{a("total")}</td><td></td><td className="pt-2 text-right font-serif-display text-lg text-[#D4AF6E]" data-testid="od-total">{formatPrice(o.total)}</td></tr>
            </tbody></table>
          </Section>
          <div className="grid sm:grid-cols-2 gap-5">
            <Section title={a("customer")}>
              <div className="text-sm space-y-1"><div>{o.full_name}</div><div className="text-[#B8AE95]">{o.email}</div><div className="text-[#B8AE95]">{o.phone || "-"}</div></div>
            </Section>
            <Section title={a("address")}>
              <div className="text-sm space-y-1"><div>{o.postal_code} {o.city}</div><div>{o.address}</div><div className="text-[#B8AE95]">{o.country}</div>{o.notes && <div className="text-[#B8AE95] italic pt-2">„{o.notes}”</div>}</div>
            </Section>
          </div>
          <Section title={a("emailsForOrder")}>
            {(o.emails || []).length === 0 ? <p className="text-sm text-[#B8AE95]">—</p> : (
              <table className="w-full text-xs"><tbody>
                {o.emails.map((e) => <tr key={e.log_id} className="border-b border-[#3d3835]"><td className="py-2">{e.event}</td><td className="py-2 text-[#B8AE95]">{e.recipient}</td><td className="py-2"><Badge value={e.status} label={a("es_" + e.status)} /></td><td className="py-2 text-[#B8AE95] whitespace-nowrap">{fmtDate(e.created_at)}</td><td className="py-2 text-right"><button onClick={() => setResend(e)} className="underline text-[#D4AF6E] focus-ring" data-testid={`od-resend-${e.log_id}`}>{a("resend")}</button></td></tr>)}
              </tbody></table>
            )}
          </Section>
          <Section title={a("history")}>
            <ul className="text-xs text-[#B8AE95] space-y-1">{(o.history || []).map((h, i) => <li key={i}>{fmtDate(h.at)} — {h.event}</li>)}</ul>
          </Section>
        </div>
        <aside className="space-y-5">
          <Section title={a("status")}>
            <div className="flex flex-wrap gap-2"><Badge value={o.payment_status} label={`${a("payment")}: ${a("ps_" + o.payment_status)}`} testId="od-payment" /><Badge value={o.fulfillment_status} label={a("fs_" + o.fulfillment_status)} testId="od-fs" /></div>
            {o.transaction_id && <p className="admin-help">SimplePay: {o.transaction_id}</p>}
            <Field label={a("changeStatus")} id="od-fs-select"><select id="od-fs-select" className="admin-input" value={fs} onChange={(e) => setFs(e.target.value)} data-testid="od-fs-select">{FS.map((s) => <option key={s} value={s}>{a("fs_" + s)}</option>)}</select></Field>
            {fs === "SHIPPED" && (
              <div className="space-y-3 border-t border-[#3d3835] pt-3">
                <div className="overline">{a("tracking")}</div>
                {[["tracking_carrier", "carrier"], ["tracking_number", "trackingNo"], ["tracking_url", "trackingUrl"], ["tracking_eta", "eta"]].map(([k, l]) => (
                  <Field key={k} label={a(l)} id={`od-${k}`}><input id={`od-${k}`} className="admin-input" value={tr[k]} onChange={(e) => setTr({ ...tr, [k]: e.target.value })} data-testid={`od-${k}`} /></Field>
                ))}
              </div>
            )}
            <Field label={a("adminNote")} id="od-note"><textarea id="od-note" rows={2} className="admin-input" value={note} onChange={(e) => setNote(e.target.value)} data-testid="od-note" /></Field>
            <button onClick={() => (fs === "CANCELLED" && o.fulfillment_status !== "CANCELLED" ? setConfirmCancel(true) : saveStatus())} disabled={busy} className="btn-primary w-full justify-center !py-2 text-sm focus-ring disabled:opacity-50" data-testid="od-save-status">{a("save")}</button>
          </Section>
          <Section title={a("invoice")}>
            <p className="admin-help">{a("inv_" + (o.invoice?.status || "NONE"))}{o.invoice?.error ? ` — ${o.invoice.error}` : ""}</p>
            <Field label={a("invoiceStatus")} id="od-inv-status"><select id="od-inv-status" className="admin-input" value={inv.status} onChange={(e) => setInv({ ...inv, status: e.target.value })} data-testid="od-inv-status">{["NONE", "ISSUED", "MANUAL", "ERROR"].map((s) => <option key={s} value={s}>{a("inv_" + s)}</option>)}</select></Field>
            <Field label={a("invoiceNo")} id="od-inv-no"><input id="od-inv-no" className="admin-input" value={inv.number || ""} onChange={(e) => setInv({ ...inv, number: e.target.value })} data-testid="od-inv-no" /></Field>
            <Field label={a("invoiceUrl")} id="od-inv-url"><input id="od-inv-url" className="admin-input" value={inv.url || ""} onChange={(e) => setInv({ ...inv, url: e.target.value })} data-testid="od-inv-url" /></Field>
            <button onClick={saveInvoice} className="btn-outline w-full justify-center !py-2 text-sm focus-ring" data-testid="od-save-invoice">{a("save")}</button>
          </Section>
        </aside>
      </div>
      {confirmCancel && <Confirm message={a("cancelConfirm")} danger onNo={() => setConfirmCancel(false)} onYes={saveStatus} testId="cancel-confirm" />}
      {resend && <Confirm message={a("resendConfirm")} onNo={() => setResend(null)} onYes={doResend} testId="resend-confirm" />}
    </Modal>
  );
}
