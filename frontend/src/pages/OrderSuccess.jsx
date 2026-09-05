import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { formatPrice, useLang } from "@/context/LangContext";
import { CheckCircle, Warning } from "@phosphor-icons/react";

export default function OrderSuccess() {
  const { orderId } = useParams();
  const [params] = useSearchParams();
  const [order, setOrder] = useState(null);
  const { t } = useLang();
  const spStatus = params.get("s") ? "signed_return" : null;

  useEffect(() => { api.get(`/orders/${orderId}`).then(({ data }) => setOrder(data)).catch(() => {}); }, [orderId]);

  const isPaid = order?.status === "FINISHED";
  const isFailed = order && ["CANCELLED", "TIMEOUT", "NOTAUTHORIZED"].includes(order.status);
  const isReserved = order?.status === "RESERVED";

  return (
    <div data-testid="order-success" className="max-w-2xl mx-auto px-6 py-24 text-center">
      {isFailed ? <Warning size={64} weight="duotone" className="mx-auto text-[#B0413E]" /> : <CheckCircle size={64} weight="duotone" className="mx-auto text-[#D4AF6E]" />}
      <div className="overline mt-6 mb-3">#{orderId}</div>
      <h1 className="font-serif-display text-5xl">{isFailed ? t("order.failed") : t("order.thanks")}</h1>
      <p className="mt-4 text-[#B8AE95] leading-relaxed">
        {isFailed ? t("order.failed") : isPaid ? t("order.paid") : isReserved ? t("order.reserved") : t("order.pending")}
      </p>
      {order && (
        <div className="mt-10 text-left bg-[#24221E] border border-[#3d3835] p-6">
          <div className="overline mb-3">{t("order.summary")}</div>
          {order.items.map((i) => (<div key={i.product_id} className="flex justify-between text-sm py-1"><span>{i.name} × {i.quantity}</span><span>{formatPrice(i.line_total)}</span></div>))}
          <div className="mt-4 pt-4 border-t border-[#3d3835] flex justify-between font-serif-display text-xl"><span>{t("cart.total")}</span><span className="text-[#D4AF6E]">{formatPrice(order.total)}</span></div>
        </div>
      )}
      <div className="mt-10"><Link to="/shop" className="btn-primary">{t("order.continue")}</Link></div>
    </div>
  );
}
