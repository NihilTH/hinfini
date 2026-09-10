import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { ArrowLeft, Clock } from "@phosphor-icons/react";
import { useLang } from "@/context/LangContext";
import Seo from "@/components/Seo";
import SmartImage from "@/components/SmartImage";

export default function GuideDetail() {
  const { slug } = useParams();
  const [guide, setGuide] = useState(null);
  const { t, tr, label } = useLang();
  useEffect(() => { api.get(`/guides/${slug}`).then(({ data }) => setGuide(data)); }, [slug]);
  if (!guide) return <div className="max-w-3xl mx-auto px-6 py-24 text-center text-[#B8AE95]" aria-live="polite">{t("shop.loading")}</div>;
  return (
    <article data-testid="guide-detail" className="max-w-3xl mx-auto px-6 py-16">
      <Seo title={tr(guide, "title")} description={tr(guide, "excerpt")} />
      <Link to="/learn" className="inline-flex items-center gap-2 text-sm text-[#B8AE95] link-underline mb-8 focus-ring" data-testid="guide-back"><ArrowLeft size={16} /> {t("learn.back")}</Link>
      <div className="overline mb-4">{label(guide.category)}</div>
      <h1 className="font-serif-display text-4xl md:text-6xl leading-tight">{tr(guide, "title")}</h1>
      <div className="flex items-center gap-3 text-sm text-[#B8AE95] mt-6"><Clock size={14} /> {guide.read_minutes} {t("learn.min")}</div>
      <div className="mt-10 aspect-[16/9] overflow-hidden bg-[#24221E] border border-[#3d3835]"><SmartImage eager src={guide.image} alt={tr(guide, "title")} className="w-full h-full object-cover opacity-90" /></div>
      {guide.hero_quote && <blockquote className="my-14 border-l-2 border-[#D4AF6E] pl-6 font-serif-display text-2xl md:text-3xl italic leading-snug">„{tr(guide, "hero_quote")}"</blockquote>}
      <div className="mt-12 space-y-12">
        {guide.sections?.map((s, i) => (<div key={i}><h2 className="font-serif-display text-2xl md:text-3xl mb-3">{tr(s, "heading")}</h2><p className="text-[#B8AE95] leading-relaxed text-lg">{tr(s, "body")}</p></div>))}
      </div>
    </article>
  );
}
