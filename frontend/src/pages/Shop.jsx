import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import ProductTile from "@/components/ProductTile";
import Seo from "@/components/Seo";
import { MagnifyingGlass, SlidersHorizontal, X } from "@phosphor-icons/react";
import { useLang } from "@/context/LangContext";
import { useCatalog } from "@/context/CatalogContext";

const SORTS = ["recommended", "price_asc", "price_desc", "newest"];

export default function Shop() {
  const { t, catName } = useLang();
  const { categories, catLabel } = useCatalog();
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "All";
  const q = params.get("q") || "";
  const sort = params.get("sort") || "recommended";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(q);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    const p = { sort };
    if (category !== "All") p.category = category;
    if (q) p.q = q;
    api.get("/products", { params: p }).then(({ data }) => setProducts(data)).catch(() => setProducts([])).finally(() => setLoading(false));
  }, [category, q, sort]);

  useEffect(() => {
    if (params.get("focus")) {
      searchRef.current?.focus();
      const n = new URLSearchParams(params); n.delete("focus"); setParams(n, { replace: true });
    }
  }, [params, setParams]);

  const update = (mut) => { const n = new URLSearchParams(params); mut(n); setParams(n); };
  const setCategory = (c) => { update((n) => (c === "All" ? n.delete("category") : n.set("category", c))); setFiltersOpen(false); };
  const submit = (e) => { e.preventDefault(); update((n) => (query ? n.set("q", query) : n.delete("q"))); };
  const title = category === "All" ? t("shop.title") : catLabel(category);

  const Filters = () => (
    <div className="flex flex-wrap gap-2" role="group" aria-label={t("shop.filters")}>
      {[{ name: "All" }, ...categories].map((c) => (
        <button key={c.name} onClick={() => setCategory(c.name)} data-testid={`filter-${c.name.toLowerCase().replace(/\s+/g, "-")}`} aria-pressed={c.name === category}
          className={`px-4 py-2 rounded-full text-sm border transition-colors focus-ring ${c.name === category ? "bg-[#D4AF6E] text-[#1A1917] border-[#D4AF6E]" : "bg-transparent text-[#F0EAD6] border-[#3d3835] hover:border-[#D4AF6E]"}`}>
          {c.name === "All" ? t("shop.all") : catName(c)}
        </button>
      ))}
    </div>
  );

  return (
    <div data-testid="shop-page" className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16">
      <Seo title={title} description={t("cats.desc")} />
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="overline mb-3">{t("nav.shop")}</div>
          <h1 className="font-serif-display text-5xl md:text-6xl">{title}</h1>
        </div>
        <form onSubmit={submit} role="search" className="flex items-center gap-2 border-b border-[#D4AF6E] pb-2 md:min-w-[300px]">
          <MagnifyingGlass size={18} className="text-[#D4AF6E]" aria-hidden />
          <label htmlFor="shop-search" className="sr-only">{t("nav.search")}</label>
          <input id="shop-search" ref={searchRef} data-testid="shop-search-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("shop.search")} className="flex-1 min-w-0 bg-transparent focus:outline-none text-sm" />
          {query && <button type="button" onClick={() => { setQuery(""); update((n) => n.delete("q")); }} aria-label={t("nav.close")} data-testid="shop-search-clear" className="text-[#B8AE95] focus-ring"><X size={14} /></button>}
          <button data-testid="shop-search-submit" className="text-xs uppercase tracking-widest text-[#D4AF6E] focus-ring">{t("shop.searchBtn")}</button>
        </form>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
        <div className="hidden md:block"><Filters /></div>
        <button onClick={() => setFiltersOpen((o) => !o)} data-testid="shop-filters-toggle" aria-expanded={filtersOpen} className="md:hidden btn-outline self-start !py-2.5 !px-5 text-sm focus-ring">
          <SlidersHorizontal size={16} /> {t("shop.filters")}{category !== "All" ? ` · ${catLabel(category)}` : ""}
        </button>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-[#B8AE95] hidden sm:inline" data-testid="shop-count">{t("shop.results", { n: products.length })}</span>
          <label htmlFor="shop-sort" className="sr-only">{t("shop.sort")}</label>
          <select id="shop-sort" data-testid="shop-sort" value={sort} onChange={(e) => update((n) => n.set("sort", e.target.value))} className="bg-[#24221E] border border-[#3d3835] px-3 py-2 rounded-sm text-sm focus:outline-none focus:border-[#D4AF6E] focus-ring">
            {SORTS.map((s) => <option key={s} value={s}>{t(`shop.sort.${s}`)}</option>)}
          </select>
        </div>
      </div>
      {filtersOpen && <div className="md:hidden mb-10 p-4 border border-[#3d3835] bg-[#24221E]" data-testid="shop-filters-mobile"><Filters /></div>}

      {loading ? <div className="text-center py-24 text-[#B8AE95]" aria-live="polite">{t("shop.loading")}</div> :
        products.length === 0 ? <div data-testid="shop-empty" className="text-center py-24 text-[#B8AE95]">{t("shop.empty")}</div> :
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-14">{products.map((p) => <ProductTile key={p.product_id} product={p} />)}</div>}
    </div>
  );
}
