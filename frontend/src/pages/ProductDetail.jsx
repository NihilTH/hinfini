import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { formatPrice, useLang } from "@/context/LangContext";
import { Minus, Plus, ShoppingBag, ArrowLeft } from "@phosphor-icons/react";

export default function ProductDetail() {
  const { slug } = useParams();
  const { add } = useCart();
  const { t } = useLang();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);

  useEffect(() => { api.get(`/products/${slug}`).then(({ data }) => setProduct(data)); }, [slug]);
  if (!product) return <div className="max-w-[1400px] mx-auto px-6 py-24 text-center">...</div>;

  return (
    <div data-testid="product-detail-page" className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12">
      <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-[#B8AE95] link-underline mb-8"><ArrowLeft size={16} /> {t("nav.shop")}</Link>
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
        <div className="bg-[#24221E] aspect-[4/5] overflow-hidden border border-[#3d3835]">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </div>
        <div className="pt-4">
          <div className="overline mb-4">{product.category}{product.subcategory ? ` · ${product.subcategory}` : ""}</div>
          <h1 className="font-serif-display text-4xl md:text-5xl leading-tight">{product.name}</h1>
          <div className="mt-6 flex items-baseline gap-4">
            <div className="font-serif-display text-3xl text-[#D4AF6E]">{formatPrice(product.price)}</div>
            <div className="text-sm text-[#B8AE95]">{product.unit}</div>
          </div>
          <p className="mt-8 text-[#B8AE95] leading-relaxed">{product.long_description || product.description}</p>
          <div className="mt-10 flex items-center gap-6">
            <div className="flex items-center border border-[#3d3835] rounded-full">
              <button onClick={() => setQty(Math.max(1, qty - 1))} data-testid="qty-decrease" className="w-10 h-10 flex items-center justify-center"><Minus size={14} /></button>
              <span data-testid="qty-value" className="w-10 text-center text-sm">{qty}</span>
              <button onClick={() => setQty(qty + 1)} data-testid="qty-increase" className="w-10 h-10 flex items-center justify-center"><Plus size={14} /></button>
            </div>
            <button onClick={() => add(product, qty)} data-testid="pd-add-to-cart" className="btn-primary flex-1 md:flex-none justify-center">
              <ShoppingBag size={18} /> {t("nav.cart")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
