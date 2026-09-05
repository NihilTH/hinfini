import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { ArrowRight, Compass } from "@phosphor-icons/react";
import ProductTile from "@/components/ProductTile";
import { useLang } from "@/context/LangContext";

export default function Home() {
  const { t } = useLang();
  const [featured, setFeatured] = useState([]);
  const [cats, setCats] = useState([]);
  useEffect(() => {
    api.get("/products", { params: { featured: true } }).then(({ data }) => setFeatured(data.slice(0, 6)));
    api.get("/categories").then(({ data }) => setCats(data));
  }, []);

  return (
    <div data-testid="home-page">
      <section className="relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-16 lg:pt-24 pb-20 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 relative z-10">
            <div className="overline mb-6">{t("hero.overline")}</div>
            <h1 className="font-serif-display text-5xl md:text-6xl lg:text-[5.5rem] leading-[0.95] tracking-tight">
              {t("hero.title1")} <em className="text-[#D4AF6E] not-italic">{t("hero.title2")}</em>
            </h1>
            <p className="mt-8 text-lg text-[#B8AE95] max-w-xl leading-relaxed">{t("hero.desc")}</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/shop" data-testid="hero-shop-btn" className="btn-primary">{t("hero.shop")} <ArrowRight size={18} weight="bold" /></Link>
              <Link to="/discover" data-testid="hero-discover-btn" className="btn-outline"><Compass size={18} /> {t("nav.discover")}</Link>
            </div>
          </div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }} className="lg:col-span-6 relative">
            <div className="relative aspect-[4/5] overflow-hidden bg-[#24221E] border border-[#3d3835]">
              <img src="https://images.unsplash.com/photo-1612293905607-b003de9e54fb" alt="candle" className="w-full h-full object-cover opacity-90" />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-[#24221E] py-24 border-y border-[#3d3835]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="overline mb-3">{t("featured.overline")}</div>
              <h2 className="font-serif-display text-4xl md:text-5xl">{t("featured.title")}</h2>
            </div>
            <Link to="/shop" className="hidden md:inline link-underline text-sm text-[#D4AF6E]">→</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-14">
            {featured.map((p) => <ProductTile key={p.product_id} product={p} />)}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="mb-14 max-w-2xl">
            <div className="overline mb-3">{t("cats.overline")}</div>
            <h2 className="font-serif-display text-4xl md:text-5xl">{t("cats.title")}</h2>
            <p className="mt-4 text-[#B8AE95]">{t("cats.desc")}</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cats.map((c, i) => (
              <Link key={c.name} to={`/shop?category=${encodeURIComponent(c.name)}`} data-testid={`category-tile-${c.name.toLowerCase().replace(/\s+/g, "-")}`} className={`group relative overflow-hidden bg-[#24221E] border border-[#3d3835] ${i % 5 === 0 ? "row-span-2 aspect-[4/5]" : "aspect-square"}`}>
                <img src={c.image} alt={c.name} className="w-full h-full object-cover opacity-70 transition-all duration-700 group-hover:scale-105 group-hover:opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1917] via-[#1A1917]/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="overline text-[#D4AF6E]">{c.tagline}</div>
                  <div className="font-serif-display text-2xl text-[#F0EAD6]">{c.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0F0E0C] py-24 border-t border-[#3d3835]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="aspect-[4/5] overflow-hidden border border-[#3d3835]">
              <img src="https://images.unsplash.com/photo-1770734331757-f40d64eafbc2" alt="Pour" className="w-full h-full object-cover opacity-90" />
            </div>
          </div>
          <div className="lg:col-span-7 lg:pl-12 order-1 lg:order-2">
            <div className="overline text-[#D4AF6E] mb-4">{t("methods.overline")}</div>
            <h2 className="font-serif-display text-4xl md:text-5xl leading-tight">
              {t("methods.title1")}<br /><em className="text-[#D4AF6E] not-italic">{t("methods.title2")}</em>
            </h2>
            <p className="mt-6 text-[#B8AE95] max-w-xl leading-relaxed">{t("methods.desc")}</p>
            <Link to="/learn" className="mt-8 inline-flex items-center gap-2 text-[#D4AF6E] link-underline text-lg">
              {t("methods.cta")} <ArrowRight size={18} weight="bold" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
