import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { formatPrice, useLang } from "@/context/LangContext";
import { useCatalog } from "@/context/CatalogContext";
import { ShoppingBag } from "@phosphor-icons/react";
import SmartImage from "@/components/SmartImage";

export default function ProductTile({ product }) {
  const { add } = useCart();
  const { t, tr } = useLang();
  const { catLabel } = useCatalog();
  const out = product.stock_state === "out" || Number(product.stock) <= 0;
  const low = product.stock_state === "low";
  const name = tr(product, "name");

  return (
    <article data-testid={`product-tile-${product.slug}`} className="product-tile group relative">
      <Link to={`/shop/${product.slug}`} className="block overflow-hidden bg-[#24221E] aspect-[4/5] border border-[#3d3835] relative" aria-label={name}>
        <SmartImage src={product.image} alt={product.image_alt || name} className={`product-image w-full h-full object-cover ${out ? "opacity-40 grayscale" : ""}`} />
        {out && <span className="absolute top-3 left-3 text-[10px] uppercase tracking-[0.2em] px-3 py-1 bg-[#1A1917]/90 text-[#B8AE95] border border-[#3d3835]">{t("tile.soldOut")}</span>}
        {!out && low && <span className="absolute top-3 left-3 text-[10px] uppercase tracking-[0.2em] px-3 py-1 bg-[#1A1917]/90 text-[#D4AF6E] border border-[#D4AF6E]/50">{t("tile.low")}</span>}
      </Link>
      <div className="mt-5 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="overline mb-1">{catLabel(product.category)}</div>
          <Link to={`/shop/${product.slug}`} className="font-serif-display text-xl leading-tight link-underline text-[#F0EAD6]">{name}</Link>
          <div className="mt-1 text-sm text-[#B8AE95]">{tr(product, "unit")}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-serif-display text-lg text-[#D4AF6E]">{formatPrice(product.price)}</div>
          <button
            onClick={() => add(product, 1)}
            disabled={out}
            data-testid={`add-${product.slug}`}
            aria-label={`${t("tile.add")}: ${name}`}
            title={out ? t("tile.soldOut") : t("tile.add")}
            className="mt-2 inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#D4AF6E] hover:text-[#E5C689] disabled:text-[#6f685f] disabled:cursor-not-allowed transition-colors"
          >
            <ShoppingBag size={14} /> {out ? t("tile.soldOut") : t("tile.add")}
          </button>
        </div>
      </div>
    </article>
  );
}
