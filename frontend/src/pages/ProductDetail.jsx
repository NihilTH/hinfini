import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { formatPrice, useLang } from "@/context/LangContext";
import { useCatalog } from "@/context/CatalogContext";
import { Minus, Plus, ShoppingBag, ArrowLeft, Truck, Package } from "@phosphor-icons/react";
import ProductTile from "@/components/ProductTile";
import SmartImage from "@/components/SmartImage";
import Seo from "@/components/Seo";

const STOCK_STYLE = { in: "text-emerald-400 border-emerald-400/40", low: "text-[#D4AF6E] border-[#D4AF6E]/50", out: "text-[#B8AE95] border-[#3d3835]" };

export default function ProductDetail() {
  const { slug } = useParams();
  const { add } = useCart();
  const { t, tr, label } = useLang();
  const { catLabel } = useCatalog();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(false);
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);

  useEffect(() => {
    setProduct(null); setError(false); setQty(1); setActive(0);
    api.get(`/products/${slug}`).then(({ data }) => setProduct(data)).catch(() => setError(true));
    window.scrollTo({ top: 0 });
  }, [slug]);

  if (error) return <div className="max-w-[1400px] mx-auto px-6 py-24 text-center" data-testid="pd-not-found"><p className="text-[#B8AE95]">{t("pd.notFound")}</p><Link to="/shop" className="btn-outline mt-6">{t("nav.shop")}</Link></div>;
  if (!product) return <div className="max-w-[1400px] mx-auto px-6 py-24 text-center text-[#B8AE95]" aria-live="polite">{t("shop.loading")}</div>;

  const name = tr(product, "name");
  const gallery = [{ url: product.image, alt: product.image_alt || name }, ...(product.images || [])].filter((g) => g.url);
  const out = product.stock_state === "out";
  const maxQty = Math.max(1, Number(product.stock || 0));

  return (
    <div data-testid="product-detail-page" className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12">
      <Seo title={name} description={tr(product, "description")} />
      <Link to={`/shop?category=${encodeURIComponent(product.category)}`} data-testid="pd-back-category" className="inline-flex items-center gap-2 text-sm text-[#B8AE95] link-underline mb-8 focus-ring">
        <ArrowLeft size={16} /> {t("pd.back", { cat: catLabel(product.category) })}
      </Link>
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
        <div>
          <div className="bg-[#24221E] aspect-[4/5] overflow-hidden border border-[#3d3835]">
            <SmartImage eager src={gallery[active]?.url} alt={gallery[active]?.alt || name} className="w-full h-full object-cover" data-testid="pd-main-image" />
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {gallery.map((g, i) => (
                <button key={i} onClick={() => setActive(i)} aria-label={`${name} ${i + 1}`} aria-pressed={active === i} data-testid={`pd-thumb-${i}`}
                  className={`aspect-square overflow-hidden border focus-ring ${active === i ? "border-[#D4AF6E]" : "border-[#3d3835]"}`}>
                  <SmartImage src={g.url} alt={g.alt || name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="pt-2">
          <div className="overline mb-4">{catLabel(product.category)}{product.subcategory ? ` · ${label(product.subcategory)}` : ""}</div>
          <h1 className="font-serif-display text-4xl md:text-5xl leading-tight">{name}</h1>
          <div className="mt-6 flex items-baseline gap-4 flex-wrap">
            <div className="font-serif-display text-3xl text-[#D4AF6E]" data-testid="pd-price">{formatPrice(product.price)}</div>
            <div className="text-sm text-[#B8AE95]">{tr(product, "unit")}</div>
            <span data-testid="pd-stock" className={`text-[11px] uppercase tracking-[0.2em] px-3 py-1 border rounded-full ${STOCK_STYLE[product.stock_state]}`}>{t(`stock.${product.stock_state}`)}</span>
          </div>
          <p className="mt-8 text-[#B8AE95] leading-relaxed" data-testid="pd-description">{tr(product, "description")}</p>

          <div className="mt-10 flex items-center gap-6 flex-wrap">
            <div className="flex items-center border border-[#3d3835] rounded-full" role="group" aria-label={t("pd.qty")}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} data-testid="qty-decrease" aria-label={t("cart.dec")} className="w-10 h-10 flex items-center justify-center focus-ring rounded-full"><Minus size={14} /></button>
              <span data-testid="qty-value" className="w-10 text-center text-sm" aria-live="polite">{qty}</span>
              <button onClick={() => setQty(Math.min(maxQty, qty + 1))} data-testid="qty-increase" aria-label={t("cart.inc")} className="w-10 h-10 flex items-center justify-center focus-ring rounded-full"><Plus size={14} /></button>
            </div>
            <button onClick={() => add(product, qty)} disabled={out} data-testid="pd-add-to-cart" className="btn-primary flex-1 md:flex-none justify-center disabled:opacity-40 disabled:cursor-not-allowed focus-ring">
              <ShoppingBag size={18} /> {out ? t("stock.out") : t("pd.add")}
            </button>
          </div>

          <div className="mt-10 grid sm:grid-cols-2 gap-4 text-sm">
            <div className="border border-[#3d3835] p-4 flex gap-3"><Truck size={22} className="text-[#D4AF6E] shrink-0" /><div><div className="overline mb-1">{t("pd.shipping")}</div><p className="text-[#B8AE95] leading-relaxed">{t("pd.shippingDesc")}</p></div></div>
            <div className="border border-[#3d3835] p-4 flex gap-3"><Package size={22} className="text-[#D4AF6E] shrink-0" /><div><div className="overline mb-1">{t("pd.stock")}</div><p className="text-[#B8AE95]">{t(`stock.${product.stock_state}`)}{product.stock_state !== "out" ? ` · ${product.stock} db` : ""}</p></div></div>
          </div>

          {(tr(product, "long_description") || (product.tags || []).length > 0) && (
            <div className="mt-10 border-t border-[#3d3835] pt-8">
              <div className="overline mb-3">{t("pd.details")}</div>
              {tr(product, "long_description") && <p className="text-[#B8AE95] leading-relaxed whitespace-pre-line" data-testid="pd-long-description">{tr(product, "long_description")}</p>}
              {(product.tags || []).length > 0 && <div className="mt-4 flex flex-wrap gap-2">{product.tags.map((tg) => <Link key={tg} to={`/shop?q=${encodeURIComponent(tg)}`} className="text-xs px-3 py-1 border border-[#3d3835] rounded-full text-[#B8AE95] hover:border-[#D4AF6E] focus-ring">#{label(tg)}</Link>)}</div>}
            </div>
          )}
        </div>
      </div>

      {product.related?.length > 0 && (
        <section className="mt-24 border-t border-[#3d3835] pt-16" data-testid="pd-related">
          <div className="overline mb-3">{catLabel(product.category)}</div>
          <h2 className="font-serif-display text-3xl md:text-4xl mb-10">{t("pd.related")}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-14">{product.related.map((r) => <ProductTile key={r.product_id} product={r} />)}</div>
        </section>
      )}
    </div>
  );
}
