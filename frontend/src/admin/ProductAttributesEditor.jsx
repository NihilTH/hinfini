import { Section, Field } from "@/admin/ui";
import TextEditor from "@/admin/TextEditor";
import ProductAttributes from "@/components/ProductAttributes";

export default function ProductAttributesEditor({ product, onChange }) {
  const items = product.attributes || [];
  const update = (index, patch) => onChange({ ...product, attributes: items.map((a, i) => i === index ? { ...a, ...patch } : a) });
  return <Section title="Termékadatok és használati útmutató">
    <p className="admin-help">Pipáld be a megjelenítendő adatokat, és írd be az értéküket. A kikapcsolt adatok megmaradnak. Emojikat is használhatsz (Windows: Win + .).</p>
    {items.map((a, i) => <div key={a.key} className="border border-[#3d3835] p-3 space-y-3">
      <label className="flex items-center gap-3"><input type="checkbox" checked={!!a.enabled} onChange={(e) => update(i, { enabled: e.target.checked })} />{a.label || "Saját adat"} megjelenítése</label>
      <div className="grid sm:grid-cols-2 gap-3">
        {[['label', 'Megnevezés (HU)'], ['label_en', 'Megnevezés (EN)'], ['value', 'Érték (HU)'], ['value_en', 'Érték (EN)']].map(([key, title]) => <Field key={key} label={title} id={`attr-${i}-${key}`}>
          <textarea id={`attr-${i}-${key}`} className="admin-input" rows={key.startsWith('value') ? 2 : 1} maxLength={key.startsWith('value') ? 500 : 100} value={a[key] || ""} onChange={(e) => update(i, { [key]: e.target.value })} />
        </Field>)}
      </div>
      {a.key.startsWith("custom_") && <button type="button" className="text-sm underline" onClick={() => onChange({ ...product, attributes: items.filter((_, j) => j !== i) })}>Saját adat törlése</button>}
    </div>)}
    <button type="button" className="btn-outline" disabled={items.length >= 30} onClick={() => onChange({ ...product, attributes: [...items, { key: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, label: "", label_en: "", value: "", value_en: "", enabled: true }] })}>+ Saját termékadat</button>
    <Field label="Használati útmutató (HU)" id="pe-usage"><TextEditor id="pe-usage" className="admin-input" rows={5} value={product.usage_instructions || ""} onChange={(e) => onChange({ ...product, usage_instructions: e.target.value })} /></Field>
    <Field label="Használati útmutató (EN)" id="pe-usage-en"><TextEditor id="pe-usage-en" className="admin-input" rows={5} value={product.usage_instructions_en || ""} onChange={(e) => onChange({ ...product, usage_instructions_en: e.target.value })} /></Field>
    <p className="admin-help">Előnézet – csak a bepipált, kitöltött adatok jelennek meg:</p>
    <ProductAttributes product={product} />
  </Section>;
}
