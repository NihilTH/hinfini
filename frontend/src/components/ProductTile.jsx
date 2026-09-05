import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/context/LangContext";
import { ShoppingBag } from "@phosphor-icons/react";

export default function ProductTile({ product }) {
  const { add } = useCart();
  return (
    <div data-testid={`product-tile-${product.slug}`} className="product-tile group">
      <Link to={`/shop/${product.slug}`} className="block overflow-hidden bg-[#24221E] aspect-[4/5] border border-[#3d3835]">
        <img src={product.image} alt={product.name} className="product-image w-full h-full object-cover" loading="lazy" />
      </Link>
      <div className="mt-5 flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="overline mb-1">{product.category}</div>
          <Link to={`/shop/${product.slug}`} className="font-serif-display text-xl leading-tight link-underline text-[#F0EAD6]">
            {product.name}
          </Link>
          <div className="mt-1 text-sm text-[#B8AE95]">{product.unit}</div>
        </div>
        <div className="text-right">
          <div className="font-serif-display text-lg text-[#D4AF6E]">{formatPrice(product.price)}</div>
          <button onClick={() => add(product, 1)} data-testid={`add-${product.slug}`} className="mt-2 inline-flex items-center gap-1 text-xs uppercase tracking-widest text-[#D4AF6E] hover:text-[#E5C689]">
            <ShoppingBag size={14} /> +
          </button>
        </div>
      </div>
    </div>
  );
}
