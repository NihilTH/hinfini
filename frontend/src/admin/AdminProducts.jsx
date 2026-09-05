import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PencilSimple, Archive, Plus, Star } from "@phosphor-icons/react";
import { adminApi, useA, errText } from "@/admin/adminApi";
import { Confirm, Badge } from "@/admin/ui";
import ProductEditor, { emptyProduct } from "@/admin/ProductEditor";
import { formatPrice } from "@/context/LangContext";
import SmartImage from "@/components/SmartImage";

export default function AdminProducts({ categories, onChanged }) {
  const a = useA();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [archived, setArchived] = useState(false);
  const [sel, setSel] = useState([]);
  const [editing, setEditing] = useState(null);
  const [toArchive, setToArchive] = useState(null);
  const [bulkCat, setBulkCat] = useState("");

  const load = useCallback(() => adminApi.products(archived).then(({ data }) => setItems(data)).catch(() => {}), [archived]);
  useEffect(() => { load(); }, [load]);

  const list = useMemo(() => {
    let l = items.filter((p) => (!cat || p.category === cat) && (!status || p.status === status) && (!q || `${p.name} ${p.name_en} ${p.slug} ${(p.tags || []).join(" ")}`.toLowerCase().includes(q.toLowerCase())));
    const by = { name: (x, y) => x.name.localeCompare(y.name), price: (x, y) => x.price - y.price, stock: (x, y) => x.stock - y.stock, newest: (x, y) => (y.created_at || "").localeCompare(x.created_at || "") };
    return [...l].sort(by[sort]);
  }, [items, q, cat, status, sort]);

  const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const allSel = list.length > 0 && list.every((p) => sel.includes(p.product_id));
  const bulk = async (action) => {
    try {
      await adminApi.bulk({ product_ids: sel, action, category: action === "set_category" ? bulkCat : undefined });
      toast.success(a("saved")); setSel([]); load(); onChanged?.();
    } catch (e) { toast.error(errText(e, a)); }
  };
  const archive = async () => {
    try { await adminApi.archiveProduct(toArchive.product_id); toast.success(a("saved")); setToArchive(null); load(); onChanged?.(); } catch (e) { toast.error(errText(e, a)); }
  };
  const stockLabel = (s) => (s <= 0 ? a("stockOut") : s <= 5 ? a("stockLow") : a("stockIn"));

  return (
    <div data-testid="admin-products">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-5">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={a("search")} aria-label={a("search")} className="admin-input lg:max-w-xs" data-testid="ap-search" />
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label={a("category")} className="admin-input lg:w-48" data-testid="ap-filter-cat"><option value="">{a("all")} — {a("category").toLowerCase()}</option>{categories.map((c) => <option key={c.name} value={c.name}>{c.name_hu || c.name}</option>)}</select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label={a("status")} className="admin-input lg:w-40" data-testid="ap-filter-status"><option value="">{a("all")} — {a("status").toLowerCase()}</option>{["published", "draft", "hidden", ...(archived ? ["archived"] : [])].map((s) => <option key={s} value={s}>{a(s)}</option>)}</select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label={a("sort")} className="admin-input lg:w-40" data-testid="ap-sort">{["newest", "name", "price", "stock"].map((s) => <option key={s} value={s}>{a("sort")}: {a("sort" + s[0].toUpperCase() + s.slice(1))}</option>)}</select>
        <label className="flex items-center gap-2 text-xs text-[#B8AE95] whitespace-nowrap cursor-pointer"><input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} className="accent-[#D4AF6E]" data-testid="ap-show-archived" /> {a("showArchived")}</label>
        <button onClick={() => setEditing(emptyProduct(categories[0]?.name))} className="btn-primary !py-2 !px-5 text-sm lg:ml-auto focus-ring" data-testid="admin-add-product"><Plus size={16} /> {a("add")}</button>
      </div>

      {sel.length > 0 && (
        <div className="admin-card p-3 mb-4 flex flex-wrap items-center gap-2 text-sm" data-testid="ap-bulk-bar">
          <span className="text-[#D4AF6E] mr-2">{a("selected", { n: sel.length })}</span>
          <button onClick={() => bulk("publish")} className="btn-outline !py-1.5 !px-3 text-xs focus-ring" data-testid="ap-bulk-publish">{a("publish")}</button>
          <button onClick={() => bulk("hide")} className="btn-outline !py-1.5 !px-3 text-xs focus-ring" data-testid="ap-bulk-hide">{a("hide")}</button>
          <button onClick={() => bulk("archive")} className="btn-outline !py-1.5 !px-3 text-xs !border-[#B0413E] focus-ring" data-testid="ap-bulk-archive">{a("archive")}</button>
          <span className="flex items-center gap-1 ml-2"><select value={bulkCat} onChange={(e) => setBulkCat(e.target.value)} className="admin-input !py-1 text-xs w-44" aria-label={a("setCategory")} data-testid="ap-bulk-cat"><option value="">{a("setCategory")}…</option>{categories.map((c) => <option key={c.name} value={c.name}>{c.name_hu || c.name}</option>)}</select>
            <button onClick={() => bulkCat && bulk("set_category")} disabled={!bulkCat} className="btn-primary !py-1.5 !px-3 text-xs focus-ring disabled:opacity-40" data-testid="ap-bulk-cat-apply">{a("apply")}</button></span>
        </div>
      )}

      <div className="admin-card overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]" data-testid="ap-table">
          <thead className="text-[10px] uppercase tracking-widest text-[#B8AE95] bg-[#1A1917]">
            <tr>
              <th className="p-3 w-8"><input type="checkbox" checked={allSel} onChange={() => setSel(allSel ? [] : list.map((p) => p.product_id))} aria-label={a("all")} className="accent-[#D4AF6E]" data-testid="ap-select-all" /></th>
              <th className="p-3 text-left">{a("name")}</th><th className="p-3 text-left">{a("category")}</th><th className="p-3 text-right">{a("price")}</th><th className="p-3 text-left">{a("stock")}</th><th className="p-3 text-left">{a("status")}</th><th className="p-3 text-right">{a("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.product_id} className="border-t border-[#3d3835] hover:bg-[#1A1917]/50" data-testid={`admin-row-${p.product_id}`}>
                <td className="p-3"><input type="checkbox" checked={sel.includes(p.product_id)} onChange={() => toggle(p.product_id)} aria-label={p.name} className="accent-[#D4AF6E]" data-testid={`ap-sel-${p.product_id}`} /></td>
                <td className="p-3"><div className="flex items-center gap-3"><div className="w-10 h-12 bg-[#1A1917] overflow-hidden shrink-0"><SmartImage src={p.image} alt={p.image_alt || p.name} className="w-full h-full object-cover" /></div><div><div className="flex items-center gap-1">{p.name}{p.featured && <Star size={12} weight="fill" className="text-[#D4AF6E]" />}</div><div className="text-[11px] text-[#8a826f]">/{p.slug}</div></div></div></td>
                <td className="p-3 text-[#B8AE95]">{categories.find((c) => c.name === p.category)?.name_hu || p.category}</td>
                <td className="p-3 text-right text-[#D4AF6E]">{formatPrice(p.price)}</td>
                <td className="p-3"><span className={`badge ${p.stock <= 0 ? "badge-red" : p.stock <= 5 ? "badge-gold" : "badge-green"}`}>{p.stock} · {stockLabel(p.stock)}</span></td>
                <td className="p-3"><Badge value={p.status} label={a(p.status)} testId={`ap-status-${p.product_id}`} /></td>
                <td className="p-3"><div className="flex justify-end gap-2">
                  <button onClick={() => setEditing(p)} aria-label={a("edit")} title={a("edit")} className="w-8 h-8 flex items-center justify-center border border-[#3d3835] hover:border-[#D4AF6E] focus-ring" data-testid={`admin-edit-${p.product_id}`}><PencilSimple size={14} /></button>
                  {p.status !== "archived" && <button onClick={() => setToArchive(p)} aria-label={a("archive")} title={a("archive")} className="w-8 h-8 flex items-center justify-center border border-[#3d3835] hover:border-[#B0413E] focus-ring" data-testid={`admin-archive-${p.product_id}`}><Archive size={14} /></button>}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="p-6 text-sm text-[#B8AE95] text-center">—</p>}
      </div>

      {editing && <ProductEditor product={editing} categories={categories} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); onChanged?.(); }} />}
      {toArchive && <Confirm message={a("archiveConfirm")} danger onNo={() => setToArchive(null)} onYes={archive} testId="archive-confirm" />}
    </div>
  );
}
