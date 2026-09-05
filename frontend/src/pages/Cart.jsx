import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { formatPrice, useLang } from "@/context/LangContext";
import { Trash, Minus, Plus, ArrowRight } from "@phosphor-icons/react";

export default function Cart() {
  const { items, updateQty, remove, subtotal } = useCart();
  const { t } = useLang();

  if (items.length === 0) {
    return (
      <div data-testid="cart-empty" className="max-w-2xl mx-auto px-6 py-32 text-center">
        <div className="overline mb-4">{t("cart.overline")}</div>
        <h1 className="font-serif-display text-5xl">{t("cart.emptyTitle")}</h1>
        <p className="mt-4 text-[#B8AE95]">{t("cart.emptyDesc")}</p>
        <Link to="/shop" className="btn-primary mt-8">{t("cart.browse")}</Link>
      </div>
    );
  }
  const shipping = subtotal >= 25000 ? 0 : 1990;
  return (
    <div data-testid="cart-page" className="max-w-[1200px] mx-auto px-6 lg:px-12 py-16">
      <div className="overline mb-3">{t("cart.overline")}</div>
      <h1 className="font-serif-display text-5xl mb-12">{t("cart.ready")}</h1>
      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 divide-y divide-[#3d3835] border-y border-[#3d3835]">
          {items.map((i) => (
            <div key={i.product_id} data-testid={`cart-item-${i.product_id}`} className="py-6 flex gap-5 items-center">
              <Link to={`/shop/${i.slug}`} className="w-24 h-28 bg-[#24221E] overflow-hidden shrink-0 border border-[#3d3835]"><img src={i.image} alt={i.name} className="w-full h-full object-cover" /></Link>
              <div className="flex-1">
                <Link to={`/shop/${i.slug}`} className="font-serif-display text-xl link-underline">{i.name}</Link>
                <div className="text-xs text-[#B8AE95] mt-1">{i.unit}</div>
                <div className="text-sm mt-2 text-[#D4AF6E]">{formatPrice(i.price)}</div>
              </div>
              <div className="flex items-center border border-[#3d3835] rounded-full">
                <button data-testid={`cart-dec-${i.product_id}`} onClick={() => updateQty(i.product_id, i.quantity - 1)} className="w-8 h-8 flex items-center justify-center"><Minus size={12} /></button>
                <span data-testid={`cart-qty-${i.product_id}`} className="w-8 text-center text-sm">{i.quantity}</span>
                <button data-testid={`cart-inc-${i.product_id}`} onClick={() => updateQty(i.product_id, i.quantity + 1)} className="w-8 h-8 flex items-center justify-center"><Plus size={12} /></button>
              </div>
              <div className="font-serif-display text-lg w-28 text-right text-[#D4AF6E]">{formatPrice(i.price * i.quantity)}</div>
              <button data-testid={`cart-remove-${i.product_id}`} onClick={() => remove(i.product_id)} className="text-[#B8AE95] hover:text-[#B0413E]" aria-label="Remove"><Trash size={18} /></button>
            </div>
          ))}
        </div>
        <aside className="bg-[#24221E] border border-[#3d3835] p-8 h-fit">
          <div className="overline mb-4">{t("co.summary")}</div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span>{t("cart.subtotal")}</span><span data-testid="cart-subtotal">{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between"><span>{t("cart.shipping")}</span><span>{shipping === 0 ? t("cart.free") : formatPrice(shipping)}</span></div>
            {subtotal < 25000 && <div className="text-xs text-[#B8AE95]">{t("cart.freeMsg", { n: new Intl.NumberFormat('hu-HU').format(25000 - subtotal) })}</div>}
            <div className="border-t border-[#3d3835] pt-3 flex justify-between font-serif-display text-xl">
              <span>{t("cart.total")}</span><span data-testid="cart-total" className="text-[#D4AF6E]">{formatPrice(subtotal + shipping)}</span>
            </div>
          </div>
          <Link to="/checkout" data-testid="cart-checkout-btn" className="btn-primary w-full justify-center mt-8">{t("cart.checkout")} <ArrowRight size={16} /></Link>
        </aside>
      </div>
    </div>
  );
}
