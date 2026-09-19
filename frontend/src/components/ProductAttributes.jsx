import FormattedText from "@/components/FormattedText";
import { useLang } from "@/context/LangContext";

export const DEFAULT_ATTRIBUTES = [
  ["color", "Szín", "Colour"], ["decoration", "Díszítés", "Decoration"],
  ["shape", "Forma", "Shape"], ["weight", "Tömeg", "Weight"],
  ["wax", "Viasz", "Wax"], ["scent", "Illat", "Scent"],
  ["making", "Készítés", "Making"], ["top_layer", "Felső réteg", "Top layer"],
  ["scent_notes", "Illatjellemző", "Scent notes"],
].map(([key, label, label_en]) => ({ key, label, label_en, enabled: false, value: "", value_en: "" }));

export function initialAttributes(saved = []) {
  return [...DEFAULT_ATTRIBUTES.map((a) => ({ ...a, ...saved.find((s) => s.key === a.key) })),
    ...saved.filter((s) => !DEFAULT_ATTRIBUTES.some((a) => a.key === s.key))];
}

export default function ProductAttributes({ product }) {
  const { lang } = useLang();
  const en = lang === "en";
  const value = (a, key) => (en && a[key + "_en"]) || a[key] || "";
  const attributes = (product.attributes || []).filter((a) => a.enabled && value(a, "label").trim() && value(a, "value").trim());
  const instructions = value(product, "usage_instructions");
  if (!attributes.length && !instructions.trim()) return null;
  return <div className="mt-8 space-y-8" data-testid="product-attributes">
    {!!attributes.length && <section><h2 className="overline mb-4">{en ? "Product information" : "Termékadatok"}</h2>
      <dl className="divide-y divide-[#3d3835]">{attributes.map((a) => <div key={a.key} className="grid sm:grid-cols-[1fr_2fr] gap-2 py-3">
        <dt className="text-[#D4AF6E] whitespace-pre-wrap break-words">{value(a, "label")}</dt>
        <dd className="text-[#B8AE95] whitespace-pre-wrap break-words">{value(a, "value")}</dd>
      </div>)}</dl></section>}
    {!!instructions.trim() && <section><h2 className="overline mb-4">{en ? "Instructions for use" : "Használati útmutató"}</h2>
      <FormattedText text={instructions} /></section>}
  </div>;
}
