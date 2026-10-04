import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { formatPrice, useLang } from "@/context/LangContext";
import { CheckCircle, Warning, HourglassMedium } from "@phosphor-icons/react";
import Seo from "@/components/Seo";

export default function OrderSuccess() {
  const { orderId } = useParams();
  const [params] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [missing, setMissing] = useState(false);
  const { t, tr, label, lang } = useLang();

  useEffect(() => {
    const r = params.get("r"), s = params.get("s");
    if (r && s) api.post("/payments/return", { r, s }).catch(() => {});
    let tries=0, timer, cancelled=false;
    const load=async()=>{
      if(cancelled)return;
      if(params.get('barion'))await api.post('/payments/status',{order_id:orderId}).catch(()=>{});
      try {
        const {data}=await api.get(`/orders/${orderId}`);
        if(cancelled)return;
        setOrder(data);
        if(!['PAID','FAILED'].includes(data.payment_status)&&tries++<12)timer=setTimeout(load,5000);
      } catch {if(!cancelled)setMissing(true);}
    };
    load();return ()=>{cancelled=true;clearTimeout(timer);};
  }, [orderId, params]);

  const pay = order?.payment_status;
  const state = pay === "PAID" ? "paid" : pay === "FAILED" ? "failed" : pay === "RESERVED" ? "reserved" : "processing";
  const Icon = state === "paid" ? CheckCircle : state === "failed" ? Warning : HourglassMedium;
  const color = state === "paid" ? "text-emerald-400" : state === "failed" ? "text-[#B0413E]" : "text-[#D4AF6E]";
  const title = state === "paid" ? t("order.paid") : state === "failed" ? t("order.failed") : t("order.recorded");
  const desc = state === "paid" ? t("order.paidDesc") : state === "failed" ? t("order.failedDesc") : state === "reserved" ? t("order.reserved") : t("order.processing");

  if (missing) return <div className="max-w-2xl mx-auto px-6 py-24 text-center" data-testid="order-missing"><p className="text-[#B8AE95]">{t("order.notFound")}</p><Link to="/shop" className="btn-outline mt-6">{t("order.continue")}</Link></div>;

  return (
    <div data-testid="order-success" data-state={state} className="max-w-2xl mx-auto px-6 py-24 text-center">
      <Seo title={title} />
      <Icon size={64} weight="duotone" className={`mx-auto ${color}`} />
      <div className="overline mt-6 mb-3">#{orderId}</div>
      <h1 className="font-serif-display text-5xl" data-testid="order-title">{title}</h1>
      <p className="mt-4 text-[#B8AE95] leading-relaxed" data-testid="order-desc">{desc}</p>
      {order?.payment_environment === "sandbox" && <p role="status" className="mt-4 text-[#D4AF6E]">{lang === "en" ? "Test order — no real payment was made." : "Tesztrendelés – nem történt valódi pénzmozgás."}</p>}
      {order && (
        <>
          <div className="mt-6 flex justify-center gap-3 text-xs uppercase tracking-[0.2em]">
            <span className="px-3 py-1 border border-[#3d3835] text-[#B8AE95]">{t("order.payment")}: <span data-testid="order-payment-status" className={color}>{t(`order.pay.${pay}`) }</span></span>
            <span className="px-3 py-1 border border-[#3d3835] text-[#B8AE95]">{t("order.ship")}: {order.shipping_method === "pickup" ? t("co.ship.pickup") : t("co.ship.home")}</span>
          </div>
          <div className="mt-10 text-left bg-[#24221E] border border-[#3d3835] p-6">
            <div className="overline mb-3">{t("order.summary")}</div>
            {order.items.map((i) => (<div key={JSON.stringify([i.product_id, i.color || ""])} className="flex justify-between text-sm py-1"><span>{tr(i, "name")}{i.color ? ` · ${label(i.color)}` : ""} × {i.quantity}</span><span>{formatPrice(i.line_total)}</span></div>))}
            <div className="mt-3 pt-3 border-t border-[#3d3835] space-y-1 text-sm text-[#B8AE95]">
              <div className="flex justify-between"><span>{t("cart.subtotal")}</span><span>{formatPrice(order.subtotal)}</span></div>
              {order.discount>0&&<div className="flex justify-between"><span>{t("co.discount")}</span><span>−{formatPrice(order.discount)}</span></div>}
              <div className="flex justify-between"><span>{t("cart.shipping")}</span><span>{order.shipping === 0 ? t("cart.free") : formatPrice(order.shipping)}</span></div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#3d3835] flex justify-between font-serif-display text-xl"><span>{t("cart.total")}</span><span className="text-[#D4AF6E]" data-testid="order-total">{formatPrice(order.total)}</span></div>
          </div>
          <p className="mt-4 text-xs text-[#B8AE95]">{t("order.emailSent")}</p>
        </>
      )}
      <div className="mt-10"><Link to="/shop" data-testid="order-continue" className="btn-primary focus-ring">{t("order.continue")}</Link></div>
    </div>
  );
}
