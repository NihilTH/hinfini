import { useEffect, useState } from "react";
import api from "@/lib/api";
import ProductTile from "@/components/ProductTile";
import { useLang } from "@/context/LangContext";
import { Shuffle } from "@phosphor-icons/react";
import Seo from "@/components/Seo";

export default function Discover() {
  const { t } = useLang();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get("/products/random", { params: { limit: 100 } }).then(({ data }) => setItems(data)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  return (
    <div data-testid="discover-page" className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16">
      <Seo title={t("disc.overline")} description={t("disc.desc")} />
      <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
        <div>
          <div className="overline mb-3">{t("disc.overline")}</div>
          <h1 className="font-serif-display text-5xl md:text-6xl">{t("disc.title")}</h1>
          <p className="mt-3 text-[#B8AE95] max-w-xl">{t("disc.desc")}</p>
        </div>
        <button onClick={load} data-testid="discover-shuffle" className="btn-outline focus-ring"><Shuffle size={18} /> {t("disc.shuffle")}</button>
      </div>
      {loading ? <div className="text-center py-24 text-[#B8AE95]" aria-live="polite">{t("shop.loading")}</div> :
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-14">
          {items.map((p) => <ProductTile key={p.product_id} product={p} />)}
        </div>}
    </div>
  );
}
