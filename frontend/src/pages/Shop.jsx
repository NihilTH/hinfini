import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import ProductTile from "@/components/ProductTile";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useLang } from "@/context/LangContext";

const CATS = ["All", "Candles", "Wax", "Fragrance Oils", "Essential Oils", "Wicks", "Containers", "Tools", "Kits"];

export default function Shop() {
  const { t } = useLang();
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "All";
  const q = params.get("q") || "";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(q);

  useEffect(() => {
    setLoading(true);
    const p = {};
    if (category && category !== "All") p.category = category;
    if (q) p.q = q;
    api.get("/products", { params: p }).then(({ data }) => { setProducts(data); setLoading(false); });
  }, [category, q]);

  const setCategory = (c) => {
    const next = new URLSearchParams(params);
    if (c === "All") next.delete("category"); else next.set("category", c);
    setParams(next);
  };
  const submit = (e) => { e.preventDefault(); const n = new URLSearchParams(params); if (query) n.set("q", query); else n.delete("q"); setParams(n); };

  return (
    <div data-testid="shop-page" className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="overline mb-3">{t("nav.shop")}</div>
          <h1 className="font-serif-display text-5xl md:text-6xl">{category === "All" ? t("shop.title") : category}</h1>
        </div>
        <form onSubmit={submit} className="flex items-center gap-2 border-b border-[#D4AF6E] pb-2 min-w-[280px]">
          <MagnifyingGlass size={18} className="text-[#D4AF6E]" />
          <input data-testid="shop-search-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("shop.search")} className="flex-1 bg-transparent focus:outline-none text-sm" />
          <button data-testid="shop-search-submit" className="text-xs uppercase tracking-widest text-[#D4AF6E]">{t("shop.searchBtn")}</button>
        </form>
      </div>
      <div className="flex flex-wrap gap-2 mb-14">
        {CATS.map((c) => (
          <button key={c} onClick={() => setCategory(c)} data-testid={`filter-${c.toLowerCase().replace(/\s+/g, "-")}`} className={`px-4 py-2 rounded-full text-sm border transition-colors ${c === category ? "bg-[#D4AF6E] text-[#1A1917] border-[#D4AF6E]" : "bg-transparent text-[#F0EAD6] border-[#3d3835] hover:border-[#D4AF6E]"}`}>{c === "All" ? t("shop.all") : c}</button>
        ))}
      </div>
      {loading ? <div className="text-center py-24 text-[#B8AE95]">...</div> :
       products.length === 0 ? <div data-testid="shop-empty" className="text-center py-24 text-[#B8AE95]">{t("shop.empty")}</div> :
       <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-14">{products.map((p) => <ProductTile key={p.product_id} product={p} />)}</div>}
    </div>
  );
}
