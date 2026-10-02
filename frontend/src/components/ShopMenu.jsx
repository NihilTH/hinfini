import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { CaretDown } from "@phosphor-icons/react";
import { useCatalog } from "@/context/CatalogContext";
import { useLang } from "@/context/LangContext";

export default function ShopMenu() {
  const { categories } = useCatalog();
  const { t, catName } = useLang();
  const [open, setOpen] = useState(false);
  return <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
    onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}
    onKeyDown={e => { if (e.key === "Escape") { setOpen(false); e.stopPropagation(); e.currentTarget.querySelector("button")?.focus(); } }}>
    <div className="flex items-center gap-1">
      <NavLink to="/shop" data-testid="nav-shop" className="nav-link link-underline whitespace-nowrap py-2 focus-ring" onClick={() => setOpen(false)}>{t("nav.shop")}</NavLink>
      <button type="button" className="w-8 h-10 flex items-center justify-center text-[#D4AF6E] focus-ring"
        aria-label={t("shop.filters")} aria-expanded={open} aria-controls="shop-category-menu" onClick={() => setOpen(o => !o)}><CaretDown size={15} /></button>
    </div>
    {open && <div id="shop-category-menu" className="absolute top-full left-0 min-w-[260px] max-w-[340px] max-h-[65vh] overflow-y-auto bg-[#24221E] border border-[#D4AF6E]/40 shadow-xl p-2 text-base">
      {[{name:"", label:t("shop.all")}, ...categories.map(c => ({name:c.name,label:catName(c)}))].map(c =>
        <Link key={c.name} to={c.name ? `/shop?category=${encodeURIComponent(c.name)}` : "/shop"} onClick={() => setOpen(false)}
          className="block px-4 py-3 text-[#F0EAD6] hover:bg-[#1A1917] hover:text-[#D4AF6E] focus-ring">{c.label}</Link>)}
    </div>}
  </div>;
}
