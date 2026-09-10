import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { ArrowRight, Clock } from "@phosphor-icons/react";
import { useLang } from "@/context/LangContext";
import Seo from "@/components/Seo";
import SmartImage from "@/components/SmartImage";

export default function Learn() {
  const [guides, setGuides] = useState([]);
  const { t, tr, label } = useLang();
  useEffect(() => { api.get("/guides").then(({ data }) => setGuides(data)); }, []);
  const byCat = guides.reduce((acc, g) => { (acc[g.category] = acc[g.category] || []).push(g); return acc; }, {});

  return (
    <div data-testid="learn-page">
      <Seo title={t("nav.learn")} description={t("learn.desc")} />
      <section className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-16 pb-12">
        <div className="overline mb-4">{t("learn.overline")}</div>
        <h1 className="font-serif-display text-5xl md:text-7xl leading-[0.95] max-w-4xl">
          {t("learn.title1")} <em className="text-[#D4AF6E] not-italic">{t("learn.title2")}</em>
        </h1>
        <p className="mt-6 max-w-2xl text-[#B8AE95] leading-relaxed text-lg">{t("learn.desc")}</p>
      </section>
      {Object.entries(byCat).map(([cat, list]) => (
        <section key={cat} className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12 border-t border-[#3d3835]">
          <div className="overline mb-8">{label(cat)}</div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {list.map((g) => (
              <Link key={g.guide_id} to={`/learn/${g.slug}`} data-testid={`guide-card-${g.slug}`} className="group focus-ring">
                <div className="aspect-[4/3] overflow-hidden bg-[#24221E] border border-[#3d3835]">
                  <SmartImage src={g.image} alt={tr(g, "title")} className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="mt-5">
                  <div className="flex items-center gap-3 text-xs text-[#B8AE95] mb-2"><Clock size={12} /> {g.read_minutes} {t("learn.min")}</div>
                  <h3 className="font-serif-display text-2xl leading-snug">{tr(g, "title")}</h3>
                  <p className="mt-2 text-sm text-[#B8AE95]">{tr(g, "excerpt")}</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm text-[#D4AF6E]">{t("learn.read")} <ArrowRight size={14} weight="bold" /></div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
