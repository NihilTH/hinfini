import { useState } from "react";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, PencilSimple, Trash, Plus } from "@phosphor-icons/react";
import { adminApi, useA, errText } from "@/admin/adminApi";
import { Modal, Confirm, Field, Badge } from "@/admin/ui";
import { ImageField } from "@/admin/Media";
import SmartImage from "@/components/SmartImage";

const empty = { name: "", name_hu: "", name_en: "", description: "", description_en: "", image: "", image_alt: "", tagline: "", order: 0, active: true };

export default function AdminCategories({ categories, reload }) {
  const a = useA();
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const move = async (i, dir) => {
    const names = categories.map((c) => c.name);
    const j = i + dir; if (j < 0 || j >= names.length) return;
    [names[i], names[j]] = [names[j], names[i]];
    try { await adminApi.reorderCategories(names); reload(); } catch (e) { toast.error(errText(e, a)); }
  };
  const save = async () => {
    const body = { ...editing, order: parseInt(editing.order) || 0, name: editing.name.trim(), name_en: editing.name_en || editing.name.trim() };
    if (!body.name || !body.name_hu) { toast.error(a("failed")); return; }
    setBusy(true);
    try {
      if (editing._original) await adminApi.updateCategory(editing._original, body); else await adminApi.createCategory(body);
      toast.success(a("saved")); setEditing(null); reload();
    } catch (e) { toast.error(errText(e, a)); } finally { setBusy(false); }
  };
  const remove = async () => {
    try { await adminApi.deleteCategory(toDelete.name); toast.success(a("saved")); setToDelete(null); reload(); } catch (e) { toast.error(errText(e, a)); setToDelete(null); }
  };
  const set = (k) => (e) => setEditing({ ...editing, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  return (
    <div data-testid="admin-categories">
      <div className="flex justify-end mb-5"><button onClick={() => setEditing({ ...empty })} className="btn-primary !py-2 !px-5 text-sm focus-ring" data-testid="admin-add-cat"><Plus size={16} /> {a("addCat")}</button></div>
      <div className="space-y-2">
        {categories.map((c, i) => (
          <div key={c.name} className="admin-card p-3 flex items-center gap-4" data-testid={`cat-row-${c.name.toLowerCase().replace(/\s+/g, "-")}`}>
            <div className="flex flex-col gap-1">
              <button onClick={() => move(i, -1)} disabled={i === 0} aria-label={a("up")} className="w-7 h-7 flex items-center justify-center border border-[#3d3835] hover:border-[#D4AF6E] disabled:opacity-30 focus-ring" data-testid={`cat-up-${i}`}><ArrowUp size={12} /></button>
              <button onClick={() => move(i, 1)} disabled={i === categories.length - 1} aria-label={a("down")} className="w-7 h-7 flex items-center justify-center border border-[#3d3835] hover:border-[#D4AF6E] disabled:opacity-30 focus-ring" data-testid={`cat-down-${i}`}><ArrowDown size={12} /></button>
            </div>
            <div className="w-14 h-14 bg-[#1A1917] overflow-hidden shrink-0"><SmartImage src={c.image} alt={c.image_alt || c.name_hu} className="w-full h-full object-cover" /></div>
            <div className="flex-1 min-w-0">
              <div className="font-serif-display text-xl flex items-center gap-2 flex-wrap">{c.name_hu || c.name} <span className="text-xs text-[#8a826f] font-sans">/ {c.name_en || c.name} · <code>{c.name}</code></span></div>
              <div className="text-xs text-[#B8AE95] mt-0.5 truncate">{a("productsCount", { n: c.count })} · #{c.order} · {c.description || c.tagline}</div>
            </div>
            <Badge value={c.active !== false ? "published" : "hidden"} label={c.active !== false ? a("active") : a("inactive")} />
            <div className="flex gap-2">
              <button onClick={() => setEditing({ ...empty, ...c, _original: c.name })} aria-label={a("edit")} className="w-8 h-8 flex items-center justify-center border border-[#3d3835] hover:border-[#D4AF6E] focus-ring" data-testid={`cat-edit-${i}`}><PencilSimple size={14} /></button>
              <button onClick={() => (c.count > 0 ? toast.error(a("catInUse", { n: c.count })) : setToDelete(c))} aria-label={a("deleteCat")} className="w-8 h-8 flex items-center justify-center border border-[#3d3835] hover:border-[#B0413E] focus-ring" data-testid={`cat-del-${i}`}><Trash size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal title={editing._original ? a("edit") : a("addCat")} onClose={() => setEditing(null)} testId="cat-editor">
          <div className="space-y-4">
            <Field label={a("catKey")} help={a("catKeyHelp")} id="ce-name"><input id="ce-name" className="admin-input" value={editing.name} onChange={set("name")} data-testid="ce-name" /></Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={a("catNameHu")} id="ce-hu"><input id="ce-hu" className="admin-input" value={editing.name_hu} onChange={set("name_hu")} data-testid="ce-name-hu" /></Field>
              <Field label={a("catNameEn")} id="ce-en"><input id="ce-en" className="admin-input" value={editing.name_en} onChange={set("name_en")} data-testid="ce-name-en" /></Field>
              <Field label={a("catDesc")} id="ce-desc"><input id="ce-desc" className="admin-input" value={editing.description} onChange={set("description")} data-testid="ce-desc" /></Field>
              <Field label={a("catDescEn")} id="ce-desc-en"><input id="ce-desc-en" className="admin-input" value={editing.description_en} onChange={set("description_en")} data-testid="ce-desc-en" /></Field>
              <Field label={a("order")} id="ce-order"><input id="ce-order" type="number" className="admin-input" value={editing.order} onChange={set("order")} data-testid="ce-order" /></Field>
              <label className="flex items-center gap-3 text-sm cursor-pointer mt-6"><input type="checkbox" checked={editing.active !== false} onChange={set("active")} className="accent-[#D4AF6E]" data-testid="ce-active" /> {a("active")}</label>
            </div>
            <ImageField label={a("cover")} value={editing.image} alt={editing.image_alt} onChange={({ url, alt }) => setEditing({ ...editing, image: url, image_alt: alt })} testId="ce-cover" />
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditing(null)} className="btn-outline !py-2 !px-5 text-sm focus-ring">{a("cancel")}</button>
              <button onClick={save} disabled={busy} className="btn-primary !py-2 !px-5 text-sm focus-ring disabled:opacity-50" data-testid="admin-save-cat">{a("save")}</button>
            </div>
          </div>
        </Modal>
      )}
      {toDelete && <Confirm message={a("deleteCatConfirm")} danger onNo={() => setToDelete(null)} onYes={remove} testId="cat-del-confirm" />}
    </div>
  );
}
