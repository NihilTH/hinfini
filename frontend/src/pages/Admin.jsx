import { useEffect, useState } from "react";
import api from "@/lib/api";
import { formatPrice, useLang } from "@/context/LangContext";
import { toast } from "sonner";
import { Trash, PencilSimple, Plus } from "@phosphor-icons/react";

const TKEY = "hi_admin_token";

const input = "w-full bg-[#1A1917] border border-[#3d3835] px-3 py-2 rounded-sm focus:outline-none focus:border-[#D4AF6E] text-sm";

export default function Admin() {
  const { t } = useLang();
  const [token, setToken] = useState(() => localStorage.getItem(TKEY) || "");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState("prods");
  const [prods, setProds] = useState([]);
  const [cats, setCats] = useState([]);
  const [editing, setEditing] = useState(null); // product being edited
  const [editingCat, setEditingCat] = useState(null);

  useEffect(() => { if (token) tryAuth(); }, []);

  const tryAuth = async () => {
    try {
      await api.post("/admin/verify", null, { headers: { "X-Admin-Token": token } });
      localStorage.setItem(TKEY, token);
      setAuthed(true);
      reload();
    } catch { toast.error("Bad token"); setAuthed(false); }
  };
  const reload = async () => {
    const p = await api.get("/products");
    const c = await api.get("/categories");
    setProds(p.data); setCats(c.data);
  };

  if (!authed) {
    return (
      <div className="max-w-md mx-auto px-6 py-24">
        <div className="overline mb-3">{t("admin.title")}</div>
        <h1 className="font-serif-display text-4xl mb-8">Admin</h1>
        <input data-testid="admin-token-input" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder={t("admin.token")} className={input + " mb-4"} />
        <button onClick={tryAuth} data-testid="admin-enter-btn" className="btn-primary w-full justify-center">{t("admin.enter")}</button>
        <p className="mt-4 text-xs text-[#B8AE95]">Default demo token: <code>hinfini-admin-2026</code></p>
      </div>
    );
  }

  const empty = (kind) => kind === "cat"
    ? { name: "", image: "", tagline: "" }
    : { slug: "", name: "", category: cats[0]?.name || "Candles", subcategory: "", price: 0, unit: "", image: "", description: "", long_description: "", stock: 100, featured: false, tags: [] };

  const saveProd = async () => {
    try {
      const body = { ...editing, price: parseInt(editing.price) || 0, stock: parseInt(editing.stock) || 0, tags: Array.isArray(editing.tags) ? editing.tags : (editing.tags || "").split(",").map((s) => s.trim()).filter(Boolean) };
      if (editing.product_id) await api.put(`/admin/products/${editing.product_id}`, body, { headers: { "X-Admin-Token": token } });
      else await api.post("/admin/products", body, { headers: { "X-Admin-Token": token } });
      toast.success("Saved");
      setEditing(null); reload();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };
  const delProd = async (id) => {
    if (!window.confirm("Delete?")) return;
    await api.delete(`/admin/products/${id}`, { headers: { "X-Admin-Token": token } });
    toast.success("Deleted"); reload();
  };
  const saveCat = async () => {
    try {
      const body = { name: editingCat.name, image: editingCat.image, tagline: editingCat.tagline };
      if (editingCat._original) await api.put(`/admin/categories/${editingCat._original}`, body, { headers: { "X-Admin-Token": token } });
      else await api.post("/admin/categories", body, { headers: { "X-Admin-Token": token } });
      toast.success("Saved"); setEditingCat(null); reload();
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };
  const delCat = async (name) => {
    if (!window.confirm(`Delete '${name}'?`)) return;
    try { await api.delete(`/admin/categories/${name}`, { headers: { "X-Admin-Token": token } }); toast.success("Deleted"); reload(); }
    catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  return (
    <div data-testid="admin-page" className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif-display text-4xl">{t("admin.title")}</h1>
        <button onClick={() => { localStorage.removeItem(TKEY); setAuthed(false); setToken(""); }} className="text-sm text-[#B8AE95] hover:text-[#D4AF6E]">Sign out</button>
      </div>
      <div className="flex gap-3 mb-8 border-b border-[#3d3835]">
        {["prods", "cats"].map((k) => (
          <button key={k} onClick={() => setTab(k)} data-testid={`admin-tab-${k}`} className={`pb-3 px-2 text-sm border-b-2 ${tab === k ? "border-[#D4AF6E] text-[#D4AF6E]" : "border-transparent text-[#B8AE95]"}`}>
            {k === "prods" ? t("admin.prods") : t("admin.cats")}
          </button>
        ))}
      </div>

      {tab === "prods" && (
        <div>
          <button onClick={() => setEditing(empty("prod"))} data-testid="admin-add-product" className="btn-primary mb-6"><Plus size={16} /> {t("admin.add")}</button>
          <div className="border border-[#3d3835]">
            <div className="grid grid-cols-12 gap-3 p-3 bg-[#24221E] text-xs uppercase tracking-widest text-[#B8AE95]">
              <div className="col-span-4">Név / Name</div><div className="col-span-3">Kategória</div><div className="col-span-2">Ár</div><div className="col-span-1">Stock</div><div className="col-span-2 text-right">Műv.</div>
            </div>
            {prods.map((p) => (
              <div key={p.product_id} data-testid={`admin-row-${p.product_id}`} className="grid grid-cols-12 gap-3 p-3 border-t border-[#3d3835] text-sm items-center">
                <div className="col-span-4">{p.name}</div>
                <div className="col-span-3 text-[#B8AE95]">{p.category}</div>
                <div className="col-span-2 text-[#D4AF6E]">{formatPrice(p.price)}</div>
                <div className="col-span-1">{p.stock}</div>
                <div className="col-span-2 flex justify-end gap-2">
                  <button onClick={() => setEditing({ ...p, tags: p.tags.join(", ") })} data-testid={`admin-edit-${p.product_id}`} className="w-8 h-8 flex items-center justify-center border border-[#3d3835] hover:border-[#D4AF6E]"><PencilSimple size={14} /></button>
                  <button onClick={() => delProd(p.product_id)} data-testid={`admin-del-${p.product_id}`} className="w-8 h-8 flex items-center justify-center border border-[#3d3835] hover:border-[#B0413E]"><Trash size={14} /></button>
                </div>
              </div>
            ))}
          </div>
          {editing && (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
              <div className="bg-[#1A1917] border border-[#3d3835] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
                <h2 className="font-serif-display text-2xl mb-4">{editing.product_id ? t("admin.edit") : t("admin.add")}</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  <label className="block"><div className="overline mb-1">Slug</div><input className={input} value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></label>
                  <label className="block"><div className="overline mb-1">Name</div><input className={input} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></label>
                  <label className="block"><div className="overline mb-1">Category</div>
                    <select className={input} value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                      {cats.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </label>
                  <label className="block"><div className="overline mb-1">Subcategory</div><input className={input} value={editing.subcategory || ""} onChange={(e) => setEditing({ ...editing, subcategory: e.target.value })} /></label>
                  <label className="block"><div className="overline mb-1">Price (Ft)</div><input type="number" className={input} value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} /></label>
                  <label className="block"><div className="overline mb-1">Unit</div><input className={input} value={editing.unit} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} /></label>
                  <label className="block"><div className="overline mb-1">Stock</div><input type="number" className={input} value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: e.target.value })} /></label>
                  <label className="block"><div className="overline mb-1">Featured</div><input type="checkbox" checked={!!editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} /></label>
                  <label className="block md:col-span-2"><div className="overline mb-1">Image URL</div><input className={input} value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} /></label>
                  <label className="block md:col-span-2"><div className="overline mb-1">Description</div><textarea rows={2} className={input} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></label>
                  <label className="block md:col-span-2"><div className="overline mb-1">Long description</div><textarea rows={4} className={input} value={editing.long_description || ""} onChange={(e) => setEditing({ ...editing, long_description: e.target.value })} /></label>
                  <label className="block md:col-span-2"><div className="overline mb-1">Tags (comma-separated)</div><input className={input} value={editing.tags} onChange={(e) => setEditing({ ...editing, tags: e.target.value })} /></label>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setEditing(null)} className="btn-outline">{t("admin.cancel")}</button>
                  <button onClick={saveProd} data-testid="admin-save-product" className="btn-primary">{t("admin.save")}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "cats" && (
        <div>
          <button onClick={() => setEditingCat({ name: "", image: "", tagline: "" })} data-testid="admin-add-cat" className="btn-primary mb-6"><Plus size={16} /> {t("admin.add")}</button>
          <div className="grid md:grid-cols-3 gap-4">
            {cats.map((c) => (
              <div key={c.name} className="border border-[#3d3835] p-4">
                <div className="font-serif-display text-xl">{c.name}</div>
                <div className="text-xs text-[#B8AE95] mt-1">{c.count} products · {c.tagline}</div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setEditingCat({ ...c, _original: c.name })} className="text-xs uppercase tracking-widest text-[#D4AF6E]">{t("admin.edit")}</button>
                  <button onClick={() => delCat(c.name)} className="text-xs uppercase tracking-widest text-[#B0413E]">{t("admin.del")}</button>
                </div>
              </div>
            ))}
          </div>
          {editingCat && (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setEditingCat(null)}>
              <div className="bg-[#1A1917] border border-[#3d3835] max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                <h2 className="font-serif-display text-2xl mb-4">{editingCat._original ? t("admin.edit") : t("admin.add")}</h2>
                <div className="space-y-3">
                  <label className="block"><div className="overline mb-1">Name</div><input className={input} value={editingCat.name} onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })} /></label>
                  <label className="block"><div className="overline mb-1">Tagline</div><input className={input} value={editingCat.tagline || ""} onChange={(e) => setEditingCat({ ...editingCat, tagline: e.target.value })} /></label>
                  <label className="block"><div className="overline mb-1">Image URL</div><input className={input} value={editingCat.image || ""} onChange={(e) => setEditingCat({ ...editingCat, image: e.target.value })} /></label>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setEditingCat(null)} className="btn-outline">{t("admin.cancel")}</button>
                  <button onClick={saveCat} data-testid="admin-save-cat" className="btn-primary">{t("admin.save")}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
