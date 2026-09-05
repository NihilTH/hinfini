import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Package, Tag, Receipt, Images, EnvelopeSimple, ListChecks, SignOut, Question } from "@phosphor-icons/react";
import { useLang } from "@/context/LangContext";
import { useCatalog } from "@/context/CatalogContext";
import { adminApi, getToken, setToken, useA } from "@/admin/adminApi";
import AdminProducts from "@/admin/AdminProducts";
import AdminCategories from "@/admin/AdminCategories";
import AdminOrders from "@/admin/AdminOrders";
import { MediaGrid } from "@/admin/Media";
import { AdminNewsletter, AdminEmailLog } from "@/admin/AdminMisc";
import Seo from "@/components/Seo";

const TABS = [
  { id: "orders", icon: Receipt, key: "orders" }, { id: "products", icon: Package, key: "products" }, { id: "categories", icon: Tag, key: "categories" },
  { id: "media", icon: Images, key: "media" }, { id: "newsletter", icon: ListChecks, key: "newsletter" }, { id: "emails", icon: EnvelopeSimple, key: "emails" },
];

export default function Admin() {
  const { t } = useLang();
  const a = useA();
  const { reload: reloadPublic } = useCatalog();
  const [params, setParams] = useSearchParams();
  const [token, setTok] = useState("");
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(!!getToken());
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState(params.get("order") ? "orders" : params.get("tab") || "orders");
  const [cats, setCats] = useState([]);
  const [stats, setStats] = useState(null);
  const [help, setHelp] = useState(false);

  const loadCats = useCallback(() => adminApi.categories().then(({ data }) => setCats(data)).catch(() => {}), []);
  const loadStats = useCallback(() => adminApi.stats().then(({ data }) => setStats(data)).catch(() => {}), []);
  const refresh = useCallback(() => { loadCats(); loadStats(); reloadPublic(); }, [loadCats, loadStats, reloadPublic]);

  useEffect(() => {
    const saved = getToken();
    if (!saved) return;
    adminApi.verify(saved).then(() => setAuthed(true)).catch(() => setToken("")).finally(() => setChecking(false));
  }, []);
  useEffect(() => { if (authed) refresh(); }, [authed, refresh]);

  const login = async (e) => {
    e?.preventDefault();
    if (!token.trim()) return;
    setBusy(true);
    try { await adminApi.verify(token.trim()); setToken(token.trim()); setAuthed(true); setTok(""); }
    catch (err) { toast.error(err?.response?.status === 429 ? err.response.data.detail : t("admin.badToken")); }
    finally { setBusy(false); }
  };
  const logout = () => { setToken(""); setAuthed(false); };
  const switchTab = (id) => { setTab(id); const n = new URLSearchParams(); n.set("tab", id); setParams(n, { replace: true }); };

  if (checking) return <div className="py-24 text-center text-[#B8AE95]">…</div>;

  if (!authed) {
    return (
      <div className="max-w-md mx-auto px-6 py-24" data-testid="admin-login">
        <Seo title={t("admin.title")} />
        <div className="overline mb-3">{t("admin.title")}</div>
        <h1 className="font-serif-display text-4xl mb-8">H'INFINI Admin</h1>
        <form onSubmit={login} className="space-y-4">
          <label htmlFor="admin-token" className="admin-label">{t("admin.token")}</label>
          <input id="admin-token" data-testid="admin-token-input" type="password" autoComplete="current-password" value={token} onChange={(e) => setTok(e.target.value)} className="admin-input !py-3" />
          <button type="submit" disabled={busy || !token} data-testid="admin-enter-btn" className="btn-primary w-full justify-center focus-ring disabled:opacity-50">{t("admin.enter")}</button>
        </form>
      </div>
    );
  }

  return (
    <div data-testid="admin-page" className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
      <Seo title={t("admin.title")} />
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div><div className="overline mb-1">H'INFINI</div><h1 className="font-serif-display text-3xl sm:text-4xl">{t("admin.title")}</h1></div>
        <div className="flex items-center gap-2">
          <button onClick={() => setHelp((h) => !h)} className="btn-outline !py-2 !px-4 text-sm focus-ring" data-testid="admin-help-btn"><Question size={16} /> {a("help")}</button>
          <button onClick={logout} className="btn-outline !py-2 !px-4 text-sm focus-ring" data-testid="admin-signout"><SignOut size={16} /> {t("admin.signOut")}</button>
        </div>
      </div>
      {help && <div className="admin-card p-4 mb-6 text-sm text-[#B8AE95] leading-relaxed" data-testid="admin-help">{a("helpText")}</div>}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8" data-testid="admin-stats">
          {[["dash_orders", stats.orders_new], ["dash_products", stats.products], ["dash_low", stats.low_stock], ["dash_subs", stats.subscribers]].map(([k, v]) => (
            <div key={k} className="admin-card p-4"><div className="overline">{a(k)}</div><div className="font-serif-display text-3xl text-[#D4AF6E] mt-1">{v}</div></div>
          ))}
          <div className="admin-card p-4 col-span-2 lg:col-span-1"><div className="overline">{a("env")}</div><div className="text-xs mt-2 space-y-0.5 text-[#B8AE95]"><div>{stats.payment_mode === "sandbox" ? a("sandbox") : a("live")}</div><div>E-mail: {stats.email_provider}</div><div>Storage: {stats.storage}</div></div></div>
        </div>
      )}

      <nav className="flex gap-1 mb-8 border-b border-[#3d3835] overflow-x-auto" aria-label="Admin">
        {TABS.map((tb) => (
          <button key={tb.id} onClick={() => switchTab(tb.id)} data-testid={`admin-tab-${tb.id}`} aria-current={tab === tb.id ? "page" : undefined}
            className={`flex items-center gap-2 pb-3 px-3 text-sm border-b-2 whitespace-nowrap focus-ring ${tab === tb.id ? "border-[#D4AF6E] text-[#D4AF6E]" : "border-transparent text-[#B8AE95] hover:text-[#F0EAD6]"}`}>
            <tb.icon size={16} /> {a(tb.key)}
          </button>
        ))}
      </nav>

      {tab === "orders" && <AdminOrders initialOrder={params.get("order")} onChanged={loadStats} />}
      {tab === "products" && <AdminProducts categories={cats} onChanged={refresh} />}
      {tab === "categories" && <AdminCategories categories={cats} reload={refresh} />}
      {tab === "media" && <div data-testid="admin-media"><p className="admin-help mb-4">{a("storageNote", { d: stats?.storage || "-" })}</p><MediaGrid /></div>}
      {tab === "newsletter" && <AdminNewsletter />}
      {tab === "emails" && <AdminEmailLog provider={stats?.email_provider} />}
    </div>
  );
}
