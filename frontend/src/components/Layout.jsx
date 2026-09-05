import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingBag, List, X, MagnifyingGlass, Compass } from "@phosphor-icons/react";
import { useCart } from "@/context/CartContext";
import { useLang } from "@/context/LangContext";
import { useEffect, useState } from "react";
import NewsletterForm from "@/components/NewsletterForm";

export const LOGO_URL = "https://customer-assets-agu9un31.emergentagent.net/job_candle-craft-hub-1/artifacts/59vqaxxs_image.png";

const LEGAL = [
  { to: "/szallitas", key: "legal.shipping" }, { to: "/elallas", key: "legal.returns" }, { to: "/aszf", key: "legal.terms" },
  { to: "/adatkezeles", key: "legal.privacy" }, { to: "/kapcsolat", key: "legal.contact" },
];

function Logo({ small }) {
  return (
    <span className="flex items-center gap-3">
      <img src={LOGO_URL} alt="H'INFINI Candles logó" width={small ? 40 : 48} height={small ? 40 : 48} className={`${small ? "h-10 w-10" : "h-12 w-12"} object-contain rounded-full`} />
      <span className="font-serif-display text-2xl tracking-wider text-[#D4AF6E]">H'INFINI</span>
      <span className="hidden md:inline text-[10px] tracking-[0.3em] text-[#B8AE95] uppercase">Candles</span>
    </span>
  );
}

function LangSwitch({ lang, setLang, t }) {
  return (
    <div role="group" aria-label={t("nav.lang")} className="flex items-center text-xs tracking-widest border border-[#3d3835] rounded-full overflow-hidden">
      {["hu", "en"].map((l) => (
        <button key={l} onClick={() => setLang(l)} data-testid={`lang-${l}`} aria-pressed={lang === l}
          className={`px-3 py-1.5 uppercase transition-colors focus-ring ${lang === l ? "bg-[#D4AF6E] text-[#1A1917] font-semibold" : "text-[#B8AE95] hover:text-[#F0EAD6]"}`}>
          {l}
        </button>
      ))}
    </div>
  );
}

export default function Layout({ children }) {
  const { count } = useCart();
  const { t, lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => { setOpen(false); }, [loc.pathname, loc.search]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  const NAV = [
    { to: "/shop", id: "shop", label: t("nav.shop") },
    { to: "/shop?category=Candles", id: "candles", label: t("nav.candles") },
    { to: "/shop?category=Fragrance%20Oils", id: "fragrances", label: t("nav.fragrances") },
    { to: "/shop?category=Tools", id: "tools", label: t("nav.tools") },
    { to: "/learn", id: "learn", label: t("nav.learn") },
    { to: "/discover", id: "discover", label: t("nav.discover") },
  ];
  const isAdmin = loc.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-[#0F0E0C] text-[#D4AF6E] text-[11px] tracking-[0.24em] text-center py-2 px-4 border-b border-[#3d3835]">{t("banner")}</div>

      <header className="sticky top-0 z-40 bg-[#1A1917]/95 backdrop-blur border-b border-[#3d3835]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 h-20 flex items-center justify-between gap-4">
          <Link to="/" data-testid="brand-logo" className="focus-ring rounded-full" aria-label="H'INFINI Candles – kezdőlap"><Logo /></Link>

          <nav className="hidden lg:flex items-center gap-7 text-sm" aria-label="Fő navigáció">
            {NAV.map((n) => (
              <Link key={n.id} to={n.to} data-testid={`nav-${n.id}`} className="link-underline text-[#F0EAD6] hover:text-[#D4AF6E] focus-ring">{n.label}</Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <LangSwitch lang={lang} setLang={setLang} t={t} />
            <button onClick={() => nav("/shop?focus=1")} data-testid="header-search-btn" className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#24221E] focus-ring" aria-label={t("nav.search")} title={t("nav.search")}>
              <MagnifyingGlass size={18} className="text-[#F0EAD6]" />
            </button>
            <Link to="/discover" data-testid="header-discover" className="hidden md:flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#24221E] focus-ring" aria-label={t("nav.discover")} title={t("nav.discover")}>
              <Compass size={20} className="text-[#D4AF6E]" />
            </Link>
            <Link to="/cart" data-testid="nav-cart" className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#24221E] focus-ring" aria-label={`${t("nav.cart")} (${count})`}>
              <ShoppingBag size={22} className="text-[#F0EAD6]" />
              {count > 0 && <span data-testid="cart-count" className="absolute -top-1 -right-1 bg-[#D4AF6E] text-[#1A1917] text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{count}</span>}
            </Link>
            <button className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#24221E] focus-ring" onClick={() => setOpen((o) => !o)} data-testid="mobile-menu-toggle" aria-label={open ? t("nav.close") : t("nav.menu")} aria-expanded={open} aria-controls="mobile-menu">
              {open ? <X size={22} /> : <List size={22} />}
            </button>
          </div>
        </div>

        {open && (
          <div id="mobile-menu" data-testid="mobile-menu" role="dialog" aria-modal="true" aria-label={t("nav.menu")} className="lg:hidden fixed inset-0 top-[calc(5rem+2.25rem)] z-40 bg-[#1A1917] overflow-y-auto">
            <nav className="px-6 py-8 flex flex-col gap-1" aria-label={t("nav.menu")}>
              {NAV.map((n) => (
                <Link key={n.id} to={n.to} data-testid={`mobile-nav-${n.id}`} className="font-serif-display text-3xl py-3 border-b border-[#3d3835] text-[#F0EAD6] hover:text-[#D4AF6E] focus-ring">{n.label}</Link>
              ))}
              <Link to="/shop?focus=1" data-testid="mobile-nav-search" className="py-3 border-b border-[#3d3835] text-sm uppercase tracking-widest text-[#B8AE95] flex items-center gap-2 focus-ring"><MagnifyingGlass size={16} /> {t("nav.search")}</Link>
              <Link to="/cart" data-testid="mobile-nav-cart" className="py-3 border-b border-[#3d3835] text-sm uppercase tracking-widest text-[#B8AE95] flex items-center gap-2 focus-ring"><ShoppingBag size={16} /> {t("nav.cart")} ({count})</Link>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#B8AE95]">
                {LEGAL.map((l) => <Link key={l.to} to={l.to} className="link-underline focus-ring">{t(l.key)}</Link>)}
              </div>
              <button onClick={() => setOpen(false)} data-testid="mobile-menu-close" className="btn-outline mt-10 self-start"><X size={16} /> {t("nav.close")}</button>
            </nav>
          </div>
        )}
      </header>

      <main id="main" className="flex-1">{children}</main>

      {!isAdmin && (
        <footer className="mt-24 bg-[#0F0E0C] text-[#B8AE95] border-t border-[#3d3835]">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            <div>
              <Link to="/" className="inline-block mb-4 focus-ring rounded-full" aria-label="H'INFINI Candles"><Logo small /></Link>
              <p className="text-sm max-w-xs leading-relaxed">{t("footer.tagline")}</p>
            </div>
            <div>
              <div className="overline mb-4 text-[#D4AF6E]">{t("footer.shop")}</div>
              <ul className="space-y-2 text-sm">
                {NAV.slice(0, 4).map((n) => <li key={n.id}><Link to={n.to} className="link-underline focus-ring">{n.label}</Link></li>)}
                <li><Link to="/discover" className="link-underline focus-ring">{t("nav.discover")}</Link></li>
                <li><Link to="/learn" className="link-underline focus-ring">{t("nav.learn")}</Link></li>
              </ul>
            </div>
            <div>
              <div className="overline mb-4 text-[#D4AF6E]">{t("footer.info")}</div>
              <ul className="space-y-2 text-sm">
                {LEGAL.map((l) => <li key={l.to}><Link to={l.to} data-testid={`footer-link-${l.to.slice(1)}`} className="link-underline focus-ring">{t(l.key)}</Link></li>)}
              </ul>
            </div>
            <div>
              <div className="overline mb-4 text-[#D4AF6E]">{t("footer.notes")}</div>
              <p className="text-sm mb-3">{t("footer.notesDesc")}</p>
              <NewsletterForm />
            </div>
          </div>
          <div className="border-t border-[#3d3835] py-6 text-xs text-center px-4">
            © {new Date().getFullYear()} H'INFINI Candles · {t("footer.tagline2")}
          </div>
        </footer>
      )}
    </div>
  );
}
