import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { formatPrice, useLang } from "@/context/LangContext";
import { useCatalog } from "@/context/CatalogContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { LockSimple, House, MapPin } from "@phosphor-icons/react";
import Seo from "@/components/Seo";

const input = "w-full bg-transparent border border-[#3d3835] px-4 py-3 rounded-sm focus:outline-none focus:border-[#D4AF6E] transition-colors text-[#F0EAD6] focus-ring";

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { t, tr, lang } = useLang();
  const { shippingFee, config } = useCatalog();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", address: "", city: "", postal_code: "", country: "Magyarország", notes: "" });
  const [shipMethod] = useState("home");
  const [terms, setTerms] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const shipping = shippingFee(subtotal, shipMethod);
  const total = subtotal + shipping;
  const on = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const errorMsg = (detail) => {
    if (!detail || typeof detail !== "string") return t("co.failed");
    if (detail.startsWith("out_of_stock:")) return t("co.outOfStock", { name: detail.split(":")[1] });
    if (detail.startsWith("unavailable:")) return t("co.unavailable");
    if (detail === "terms_required") return t("co.termsReq");
    if (detail === "cart_empty") return t("co.emptyCart");
    return t("co.failed");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (items.length === 0) { toast.error(t("co.emptyCart")); return; }
    if (!terms) { toast.error(t("co.termsReq")); return; }
    setBusy(true);
    let order;
    try {
      const res = await api.post("/orders", { ...form, shipping_method: shipMethod, accepted_terms: terms, newsletter_opt_in: newsletter, lang, items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })) });
      order = res.data;
    } catch (err) { toast.error(errorMsg(err?.response?.data?.detail)); setBusy(false); return; }
    clear();
    try {
      const { data: pay } = await api.post("/payments/start", { order_id: order.order_id, return_origin: window.location.origin });
      if (pay.paymentUrl) { window.location.href = pay.paymentUrl; return; }
      toast.message(t("co.reserved"));
    } catch { toast.message(t("co.reserved")); }
    nav(`/order/${order.order_id}`);
  };

  const SHIP = [
    { id: "home", icon: House, label: t("co.ship.home"), desc: t("co.ship.homeDesc"), fee: shippingFee(subtotal, "home"), enabled: true },
    { id: "pickup", icon: MapPin, label: t("co.ship.pickup"), desc: t("co.ship.pickupDesc"), fee: shippingFee(subtotal, "pickup"), enabled: false },
  ];

  return (
    <div data-testid="checkout-page" className="max-w-[1200px] mx-auto px-6 lg:px-12 py-16">
      <Seo title={t("cart.checkout")} />
      <div className="overline mb-3">{t("cart.checkout")}</div>
      <h1 className="font-serif-display text-5xl mb-12">{t("co.title")}</h1>
      <form onSubmit={submit} className="grid lg:grid-cols-3 gap-12" noValidate={false}>
        <div className="lg:col-span-2 space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <Field label={t("co.name")} id="co-fullname"><input id="co-fullname" required autoComplete="name" data-testid="co-fullname" value={form.full_name} onChange={on("full_name")} className={input} /></Field>
            <Field label={t("co.email")} id="co-email"><input id="co-email" required type="email" autoComplete="email" data-testid="co-email" value={form.email} onChange={on("email")} className={input} /></Field>
          </div>
          <Field label={t("co.phone")} id="co-phone"><input id="co-phone" type="tel" autoComplete="tel" data-testid="co-phone" value={form.phone} onChange={on("phone")} className={input} /></Field>
          <Field label={t("co.address")} id="co-address"><input id="co-address" required autoComplete="street-address" data-testid="co-address" value={form.address} onChange={on("address")} className={input} /></Field>
          <div className="grid md:grid-cols-3 gap-5">
            <Field label={t("co.city")} id="co-city"><input id="co-city" required autoComplete="address-level2" data-testid="co-city" value={form.city} onChange={on("city")} className={input} /></Field>
            <Field label={t("co.zip")} id="co-postal"><input id="co-postal" required autoComplete="postal-code" data-testid="co-postal" value={form.postal_code} onChange={on("postal_code")} className={input} /></Field>
            <Field label={t("co.country")} id="co-country"><input id="co-country" required autoComplete="country-name" data-testid="co-country" value={form.country} onChange={on("country")} className={input} /></Field>
          </div>

          <fieldset className="pt-2">
            <legend className="overline mb-3">{t("co.shipMethod")}</legend>
            <div className="grid md:grid-cols-2 gap-3">
              {SHIP.map((s) => (
                <label key={s.id} data-testid={`ship-${s.id}`} className={`relative flex gap-3 p-4 border rounded-sm ${shipMethod === s.id ? "border-[#D4AF6E] bg-[#24221E]" : "border-[#3d3835]"} ${s.enabled ? "cursor-pointer" : "opacity-60 cursor-not-allowed"}`}>
                  <input type="radio" name="ship" value={s.id} checked={shipMethod === s.id} disabled={!s.enabled} readOnly className="mt-1 accent-[#D4AF6E]" aria-describedby={`ship-${s.id}-desc`} />
                  <s.icon size={22} className="text-[#D4AF6E] shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2"><span className="font-medium">{s.label}</span><span className="text-sm text-[#D4AF6E]">{s.fee === 0 ? t("cart.free") : formatPrice(s.fee)}</span></div>
                    <p id={`ship-${s.id}-desc`} className="text-xs text-[#B8AE95] mt-1">{s.desc}</p>
                    {!s.enabled && <span className="inline-block mt-2 text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 border border-[#3d3835] text-[#B8AE95]">{t("co.ship.soon")}</span>}
                  </div>
                </label>
              ))}
            </div>
          </fieldset>

          <Field label={t("co.notes")} id="co-notes"><textarea id="co-notes" rows={3} data-testid="co-notes" value={form.notes} onChange={on("notes")} className={input} /></Field>

          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-3 text-sm cursor-pointer">
              <input type="checkbox" required checked={terms} onChange={(e) => setTerms(e.target.checked)} data-testid="co-terms" className="mt-1 accent-[#D4AF6E] focus-ring" />
              <span>{t("co.terms")} <Link to="/aszf" target="_blank" className="text-[#D4AF6E] underline focus-ring">{t("co.termsLink")}</Link> {t("co.and")} <Link to="/adatkezeles" target="_blank" className="text-[#D4AF6E] underline focus-ring">{t("co.privacyLink")}</Link>. *</span>
            </label>
            <label className="flex items-start gap-3 text-sm cursor-pointer text-[#B8AE95]">
              <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} data-testid="co-newsletter" className="mt-1 accent-[#D4AF6E] focus-ring" />
              <span>{t("co.newsletter")}</span>
            </label>
          </div>

          <div className="p-4 bg-[#24221E] border border-[#3d3835] text-sm text-[#B8AE95] leading-relaxed flex gap-3" data-testid="co-pay-info">
            <LockSimple size={18} className="text-[#D4AF6E] shrink-0 mt-0.5" /> <span>{t("co.payInfo")}{config.payment_mode === "sandbox" ? "" : ""}</span>
          </div>
        </div>

        <aside className="bg-[#24221E] border border-[#3d3835] p-8 h-fit" aria-label={t("co.summary")}>
          <div className="overline mb-4">{t("co.summary")}</div>
          <table className="w-full text-sm" data-testid="co-items">
            <thead className="sr-only"><tr><th>{t("co.item")}</th><th>{t("co.quantity")}</th><th>{t("cart.total")}</th></tr></thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.product_id} className="align-top"><td className="py-1.5 pr-2">{tr(i, "name")}</td><td className="py-1.5 px-3 text-[#B8AE95] whitespace-nowrap">× {i.quantity}</td><td className="py-1.5 text-right whitespace-nowrap">{formatPrice(i.price * i.quantity)}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-[#3d3835] mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>{t("cart.subtotal")}</span><span data-testid="co-subtotal">{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between"><span>{t("cart.shipping")}</span><span data-testid="co-shipping">{shipping === 0 ? t("cart.free") : formatPrice(shipping)}</span></div>
            <div className="flex justify-between font-serif-display text-xl pt-2 border-t border-[#3d3835]"><span>{t("cart.total")}</span><span data-testid="co-total" className="text-[#D4AF6E]">{formatPrice(total)}</span></div>
          </div>
          <button type="submit" disabled={busy || items.length === 0} data-testid="co-submit" className="btn-primary w-full justify-center mt-8 disabled:opacity-60 focus-ring">{busy ? t("co.submitting") : t("co.submit")}</button>
          <p className="mt-3 text-[11px] text-[#B8AE95] text-center">{t("co.legalNote")}</p>
        </aside>
      </form>
    </div>
  );
}
function Field({ label, id, children }) { return <div><label htmlFor={id} className="overline mb-2 block">{label}</label>{children}</div>; }
