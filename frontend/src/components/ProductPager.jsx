import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import api from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { adjacentProducts } from "@/lib/shopNavigation";

export default function ProductPager({ product, back }) {
  const { lang, tr } = useLang();
  const [list, setList] = useState([]);
  useEffect(() => {
    let live = true;
    setList([]);
    const query = new URL(back, "https://local.invalid").searchParams;
    const params = { sort: query.get("sort") || "recommended" };
    if (query.get("category") && query.get("category") !== "All") params.category = query.get("category");
    if (query.get("q")) params.q = query.get("q");
    api.get("/products", { params }).then(({ data }) => { if (live) setList(Array.isArray(data) ? data : []); }).catch(() => {});
    return () => { live = false; };
  }, [back]);
  const pair = adjacentProducts(list, product.slug);
  if (!pair) return null;
  return <nav className="product-pager" aria-label={lang === "hu" ? "Lapozás a termékek között" : "Browse products"}>
    {pair.map((p, i) => <Link key={i} to={`/shop/${encodeURIComponent(p.slug)}?from=${encodeURIComponent(back)}`}
      className={`product-pager-link focus-ring ${i === 0 ? "previous" : "next"}`}
      data-testid={i === 0 ? "pd-previous" : "pd-next"}
      title={tr(p, "name")} aria-label={`${i === 0 ? (lang === "hu" ? "Előző" : "Previous") : (lang === "hu" ? "Következő" : "Next")}: ${tr(p, "name")}`}>
      {i === 0 && <ArrowLeft size={22} />}
      <span>{i === 0 ? (lang === "hu" ? "Előző" : "Previous") : (lang === "hu" ? "Következő" : "Next")}</span>
      {i === 1 && <ArrowRight size={22} />}
    </Link>)}
  </nav>;
}
