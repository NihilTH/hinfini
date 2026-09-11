import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { ArrowRight, Compass, Fire, Users, Sparkle } from "@phosphor-icons/react";
import ProductTile from "@/components/ProductTile";
import SmartImage from "@/components/SmartImage";
import Seo from "@/components/Seo";
import { useLang } from "@/context/LangContext";
import { useCatalog } from "@/context/CatalogContext";

export default function Home() {
  const { t, tr, catName } = useLang();
  const { categories } = useCatalog();
  const [featured, setFeatured] = useState([]);
  useEffect(() => {
    api.get("/products", { params: { featured: true } }).then(({ data }) => setFeatured(data.slice(0, 6))).catch(() => {});
  }, []);

  const PILLARS = [
    { icon: Sparkle, title: t("brand.why"), desc: t("brand.whyDesc") },
    { icon: Users, title: t("brand.who"), desc: t("brand.whoDesc") },
    { icon: Fire, title: t("brand.what"), desc: t("brand.whatDesc") },
  ];

  return (
    <div data-testid="home-page">
      <Seo title={t("hero.title1") + " " + t("hero.title2")} description={t("hero.desc")} />
      <section className="relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-16 lg:pt-24 pb-20 grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-6 relative z-10">
            <img src="/hinfini-logo.png" alt="H’INFINI Candles" className="w-44 h-44 sm:w-56 sm:h-56 object-cover rounded-full mx-auto mb-8 border border-[#D4AF6E]/30" />
            <div className="overline mb-6">{t("hero.overline")}</div>
            <h1 className="font-serif-display text-5xl md:text-6xl lg:text-[5.5rem] leading-[0.95] tracking-tight">
              {t("hero.title1")} <em className="text-[#D4AF6E] not-italic">{t("hero.title2")}</em>
            </h1>
            <p className="mt-8 text-lg text-[#B8AE95] max-w-xl leading-relaxed">{t("hero.desc")}</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/shop" data-testid="hero-shop-btn" className="btn-primary focus-ring">{t("hero.shop")} <ArrowRight size={18} weight="bold" /></Link>
              <Link to="/discover" data-testid="hero-discover-btn" className="btn-outline focus-ring"><Compass size={18} /> {t("nav.discover")}</Link>
            </div>
          </div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }} className="lg:col-span-6 relative">
            <div className="relative aspect-[4/5] overflow-hidden bg-[#24221E] border border-[#3d3835]">
              <SmartImage eager src="https://images.unsplash.com/photo-1612293905607-b003de9e54fb?w=1200&q=80" alt="Kézzel öntött H'INFINI gyertya meleg fényben" className="w-full h-full object-cover opacity-90" />
            </div>
          </motion.div>
        </div>
      </section>

      <section data-testid="brand-section" className="bg-[#24221E] py-24 border-y border-[#3d3835]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <div className="overline mb-3">{t("brand.overline")}</div>
            <h2 className="font-serif-display text-4xl md:text-5xl leading-tight">{t("brand.title")}</h2>
            <p className="mt-6 text-[#B8AE95] leading-relaxed">{t("brand.p1")}</p>
            <p className="mt-4 text-[#B8AE95] leading-relaxed">{t("brand.p2")}</p>
          </div>
          <div className="lg:col-span-7 grid sm:grid-cols-3 gap-6 lg:pl-8">
            {PILLARS.map((p, i) => (
              <motion.div key={p.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                className="border border-[#3d3835] p-6 bg-[#1A1917]/40">
                <p.icon size={26} className="text-[#D4AF6E]" weight="duotone" />
                <h3 className="font-serif-display text-2xl mt-4">{p.title}</h3>
                <p className="mt-3 text-sm text-[#B8AE95] leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="overline mb-3">{t("featured.overline")}</div>
              <h2 className="font-serif-display text-4xl md:text-5xl">{t("featured.title")}</h2>
            </div>
            <Link to="/shop" data-testid="featured-all-link" className="hidden md:inline-flex items-center gap-2 link-underline text-sm text-[#D4AF6E] focus-ring">{t("featured.all")} <ArrowRight size={14} /></Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-14">
            {featured.map((p) => <ProductTile key={p.product_id} product={p} />)}
          </div>
        </div>
      </section>

      <section className="bg-[#24221E] py-24 border-y border-[#3d3835]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="mb-14 max-w-2xl">
            <div className="overline mb-3">{t("cats.overline")}</div>
            <h2 className="font-serif-display text-4xl md:text-5xl">{t("cats.title")}</h2>
            <p className="mt-4 text-[#B8AE95]">{t("cats.desc")}</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((c, i) => (
              <Link key={c.name} to={`/shop?category=${encodeURIComponent(c.name)}`} data-testid={`category-tile-${c.name.toLowerCase().replace(/\s+/g, "-")}`}
                className={`group relative overflow-hidden bg-[#1A1917] border border-[#3d3835] focus-ring ${i % 5 === 0 ? "row-span-2 aspect-[4/5]" : "aspect-square"}`}>
                <SmartImage src={c.image || "/hinfini-logo.png"} alt={c.image_alt || catName(c)} className="w-full h-full object-cover opacity-70 transition-all duration-700 group-hover:scale-105 group-hover:opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1917] via-[#1A1917]/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="overline text-[#D4AF6E]">{tr(c, "description") || c.tagline}</div>
                  <div className="font-serif-display text-2xl text-[#F0EAD6]">{catName(c)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>


    </div>
  );
}
