import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "@phosphor-icons/react";
import { adminApi, useA, errText, slugify } from "@/admin/adminApi";
import { Modal, Field, Section } from "@/admin/ui";
import { ImageField, ImagePickerModal } from "@/admin/Media";
import ProductTile from "@/components/ProductTile";

export const emptyProduct = (cat) => ({
  slug: "", name: "", name_en: "", category: cat || "", subcategory: "", price: 0, unit: "", unit_en: "", image: "", image_alt: "", images: [],
  description: "", description_en: "", long_description: "", long_description_en: "", stock: 0, featured: false, tags: "", status: "draft",
});

export default function ProductEditor({ product, categories, onClose, onSaved }) {
  const a = useA();
  const [p, setP] = useState({ ...product, tags: Array.isArray(product.tags) ? product.tags.join(", ") : product.tags || "" });
  const [busy, setBusy] = useState(false);
  const [galleryPick, setGalleryPick] = useState(false);
  const set = (k) => (e) => setP({ ...p, [k]: e?.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e });

  const save = async (status) => {
    const body = { ...p, status: status || p.status, price: parseInt(p.price) || 0, stock: parseInt(p.stock) || 0, images: p.images || [],
      tags: (p.tags || "").split(",").map((s) => s.trim()).filter(Boolean), slug: slugify(p.slug || p.name) };
    if (!body.name || !body.category || !body.slug) { toast.error(a("failed")); return; }
    setBusy(true);
    try {
      if (p.product_id) await adminApi.updateProduct(p.product_id, body); else await adminApi.createProduct(body);
      toast.success(a("saved")); onSaved();
    } catch (e) { toast.error(errText(e, a)); } finally { setBusy(false); }
  };

  const previewProduct = { ...p, price: parseInt(p.price) || 0, stock: parseInt(p.stock) || 0, stock_state: (parseInt(p.stock) || 0) <= 0 ? "out" : (parseInt(p.stock) || 0) <= 5 ? "low" : "in", slug: p.slug || "preview" };

  return (
    <Modal title={p.product_id ? a("edit") : a("add")} onClose={onClose} wide testId="product-editor">
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Section title={a("basics")}>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={a("nameHu")} id="pe-name"><input id="pe-name" className="admin-input" value={p.name} onChange={set("name")} data-testid="pe-name" /></Field>
              <Field label={a("nameEn")} id="pe-name-en"><input id="pe-name-en" className="admin-input" value={p.name_en || ""} onChange={set("name_en")} data-testid="pe-name-en" /></Field>
              <Field label={a("slug")} help={a("slugHelp")} id="pe-slug">
                <div className="flex gap-2"><input id="pe-slug" className="admin-input" value={p.slug} onChange={set("slug")} data-testid="pe-slug" /><button type="button" onClick={() => setP({ ...p, slug: slugify(p.name) })} className="btn-outline !py-1 !px-3 text-xs whitespace-nowrap focus-ring" data-testid="pe-slug-gen">{a("slugGen")}</button></div>
              </Field>
              <Field label={a("category")} id="pe-category">
                <select id="pe-category" className="admin-input" value={p.category} onChange={set("category")} data-testid="pe-category">
                  <option value="">—</option>{categories.map((c) => <option key={c.name} value={c.name}>{c.name_hu || c.name}</option>)}
                </select>
              </Field>
              <Field label={a("subcategory")} id="pe-sub"><input id="pe-sub" className="admin-input" value={p.subcategory || ""} onChange={set("subcategory")} data-testid="pe-subcategory" /></Field>
              <Field label={a("status")} help={a("statusHelp")} id="pe-status">
                <select id="pe-status" className="admin-input" value={p.status} onChange={set("status")} data-testid="pe-status">
                  {["published", "draft", "hidden"].map((s) => <option key={s} value={s}>{a(s)}</option>)}
                </select>
              </Field>
              <Field label={a("shortDesc")} id="pe-desc"><textarea id="pe-desc" rows={2} className="admin-input" value={p.description} onChange={set("description")} data-testid="pe-description" /></Field>
              <Field label={a("shortDescEn")} id="pe-desc-en"><textarea id="pe-desc-en" rows={2} className="admin-input" value={p.description_en || ""} onChange={set("description_en")} data-testid="pe-description-en" /></Field>
            </div>
          </Section>
          <Section title={a("sales")}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label={`${a("price")} (Ft)`} help={a("priceHelp")} id="pe-price"><input id="pe-price" type="number" min="0" className="admin-input" value={p.price} onChange={set("price")} data-testid="pe-price" /></Field>
              <Field label={a("unit")} help={a("unitHelp")} id="pe-unit"><input id="pe-unit" className="admin-input" value={p.unit} onChange={set("unit")} data-testid="pe-unit" /></Field>
              <Field label={a("unitEn")} id="pe-unit-en"><input id="pe-unit-en" className="admin-input" value={p.unit_en || ""} onChange={set("unit_en")} data-testid="pe-unit-en" /></Field>
              <Field label={a("stock")} help={a("stockHelp")} id="pe-stock"><input id="pe-stock" type="number" min="0" className="admin-input" value={p.stock} onChange={set("stock")} data-testid="pe-stock" /></Field>
            </div>
            <label className="flex items-center gap-3 text-sm cursor-pointer"><input type="checkbox" checked={!!p.featured} onChange={set("featured")} className="accent-[#D4AF6E]" data-testid="pe-featured" /> {a("featured")} <span className="admin-help !mt-0">— {a("featuredHelp")}</span></label>
          </Section>
          <Section title={a("content")}>
            <Field label={a("longDesc")} id="pe-long"><textarea id="pe-long" rows={5} className="admin-input" value={p.long_description || ""} onChange={set("long_description")} data-testid="pe-long-description" /></Field>
            <Field label={a("longDescEn")} id="pe-long-en"><textarea id="pe-long-en" rows={4} className="admin-input" value={p.long_description_en || ""} onChange={set("long_description_en")} data-testid="pe-long-description-en" /></Field>
            <Field label={a("tags")} help={a("tagsHelp")} id="pe-tags"><input id="pe-tags" className="admin-input" value={p.tags} onChange={set("tags")} data-testid="pe-tags" /></Field>
          </Section>
          <Section title={a("images")}>
            <ImageField label={a("mainImage")} value={p.image} alt={p.image_alt} onChange={({ url, alt }) => setP({ ...p, image: url, image_alt: alt })} testId="pe-main-image" />
            <div>
              <span className="admin-label">{a("gallery")}</span>
              <div className="flex flex-wrap gap-3">
                {(p.images || []).map((g, i) => (
                  <div key={i} className="w-28 space-y-1" data-testid={`pe-gallery-${i}`}>
                    <div className="w-28 h-28 bg-[#1A1917] border border-[#3d3835] overflow-hidden"><img src={g.url} alt={g.alt || ""} className="w-full h-full object-cover" /></div>
                    <input value={g.alt || ""} onChange={(e) => setP({ ...p, images: p.images.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)) })} placeholder={a("alt")} aria-label={a("alt")} className="admin-input !py-1 text-xs" />
                    <button type="button" onClick={() => setP({ ...p, images: p.images.filter((_, j) => j !== i) })} className="text-xs text-[#B0413E] underline focus-ring">{a("removeImage")}</button>
                  </div>
                ))}
                <button type="button" onClick={() => setGalleryPick(true)} className="w-28 h-28 border-2 border-dashed border-[#3d3835] hover:border-[#D4AF6E] flex flex-col items-center justify-center text-xs text-[#B8AE95] focus-ring" data-testid="pe-gallery-add"><Plus size={18} /> {a("addImage")}</button>
              </div>
            </div>
          </Section>
        </div>
        <aside className="space-y-4">
          <div className="admin-card p-4">
            <h3 className="overline text-[#D4AF6E] mb-4">{a("preview")}</h3>
            <div className="pointer-events-none max-w-[260px]"><ProductTile product={previewProduct} /></div>
          </div>
          <div className="admin-card p-4 space-y-2">
            <button onClick={() => save("published")} disabled={busy} className="btn-primary w-full justify-center !py-2.5 text-sm focus-ring disabled:opacity-50" data-testid="pe-save-publish">{a("savePublish")}</button>
            <button onClick={() => save("draft")} disabled={busy} className="btn-outline w-full justify-center !py-2.5 text-sm focus-ring disabled:opacity-50" data-testid="pe-save-draft">{a("saveDraft")}</button>
            <button onClick={() => save()} disabled={busy} className="w-full text-xs text-[#B8AE95] underline py-1 focus-ring" data-testid="pe-save">{a("save")} ({a(p.status)})</button>
          </div>
        </aside>
      </div>
      {galleryPick && <ImagePickerModal onClose={() => setGalleryPick(false)} onPick={(m) => setP({ ...p, images: [...(p.images || []), { url: m.url, alt: m.alt || "" }] })} />}
    </Modal>
  );
}
