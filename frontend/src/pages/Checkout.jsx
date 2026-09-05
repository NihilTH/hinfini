import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { formatPrice, useLang } from "@/context/LangContext";
import api from "@/lib/api";
import { toast } from "sonner";

const input = "w-full bg-transparent border border-[#3d3835] px-4 py-3 rounded-sm focus:outline-none focus:border-[#D4AF6E] transition-colors text-[#F0EAD6]";

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { t } = useLang();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", address: "", city: "", postal_code: "", country: "Magyarország", notes: "" });
  const shipping = subtotal >= 25000 ? 0 : 1990;
  const total = subtotal + shipping;
  const on = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (items.length === 0) { toast.error("Empty cart"); return; }
    setBusy(true);
    try {
      const { data: order } = await api.post("/orders", { ...form, items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })) });
      const { data: pay } = await api.post("/payments/start", { order_id: order.order_id, return_origin: window.location.origin });
      clear();
      if (pay.paymentUrl) {
        window.location.href = pay.paymentUrl;
      } else {
        toast.success("Rendelés lefoglalva");
        nav(`/order/${order.order_id}`);
      }
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); setBusy(false); }
  };

  return (
    <div data-testid="checkout-page" className="max-w-[1200px] mx-auto px-6 lg:px-12 py-16">
      <div className="overline mb-3">{t("cart.checkout")}</div>
      <h1 className="font-serif-display text-5xl mb-12">{t("co.title")}</h1>
      <form onSubmit={submit} className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <Field label={t("co.name")}><input required data-testid="co-fullname" value={form.full_name} onChange={on("full_name")} className={input} /></Field>
            <Field label={t("co.email")}><input required type="email" data-testid="co-email" value={form.email} onChange={on("email")} className={input} /></Field>
          </div>
          <Field label={t("co.phone")}><input data-testid="co-phone" value={form.phone} onChange={on("phone")} className={input} /></Field>
          <Field label={t("co.address")}><input required data-testid="co-address" value={form.address} onChange={on("address")} className={input} /></Field>
          <div className="grid md:grid-cols-3 gap-5">
            <Field label={t("co.city")}><input required data-testid="co-city" value={form.city} onChange={on("city")} className={input} /></Field>
            <Field label={t("co.zip")}><input required data-testid="co-postal" value={form.postal_code} onChange={on("postal_code")} className={input} /></Field>
            <Field label={t("co.country")}><input required data-testid="co-country" value={form.country} onChange={on("country")} className={input} /></Field>
          </div>
          <Field label={t("co.notes")}><textarea rows={3} data-testid="co-notes" value={form.notes} onChange={on("notes")} className={input} /></Field>
          <div className="p-4 bg-[#24221E] border border-[#3d3835] text-sm text-[#B8AE95] leading-relaxed">
            🔒 {t("co.payInfo")}
          </div>
        </div>
        <aside className="bg-[#24221E] border border-[#3d3835] p-8 h-fit">
          <div className="overline mb-4">{t("co.summary")}</div>
          <div className="space-y-2 max-h-64 overflow-y-auto text-sm">
            {items.map((i) => (<div key={i.product_id} className="flex justify-between"><span>{i.name} × {i.quantity}</span><span>{formatPrice(i.price * i.quantity)}</span></div>))}
          </div>
          <div className="border-t border-[#3d3835] mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>{t("cart.subtotal")}</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between"><span>{t("cart.shipping")}</span><span>{shipping === 0 ? t("cart.free") : formatPrice(shipping)}</span></div>
            <div className="flex justify-between font-serif-display text-xl pt-2 border-t border-[#3d3835]"><span>{t("cart.total")}</span><span className="text-[#D4AF6E]">{formatPrice(total)}</span></div>
          </div>
          <button type="submit" disabled={busy} data-testid="co-submit" className="btn-primary w-full justify-center mt-8 disabled:opacity-60">{busy ? t("co.submitting") : t("co.submit")}</button>
        </aside>
      </form>
    </div>
  );
}
function Field({ label, children }) { return <label className="block"><div className="overline mb-2">{label}</div>{children}</label>; }
