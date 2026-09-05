import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, List, X, MagnifyingGlass, Compass } from "@phosphor-icons/react";
import { useCart } from "@/context/CartContext";
import { useLang } from "@/context/LangContext";
import { useState } from "react";

export default function Layout({ children }) {
  const { count } = useCart();
  const { t, lang, toggle } = useLang();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  const NAV = [
    { to: "/shop", label: t("nav.shop") },
    { to: "/shop?category=Candles", label: t("nav.candles") },
    { to: "/shop?category=Fragrance%20Oils", label: t("nav.fragrances") },
    { to: "/shop?category=Tools", label: t("nav.tools") },
    { to: "/learn", label: t("nav.learn") },
    { to: "/discover", label: t("nav.discover") },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-[#0F0E0C] text-[#D4AF6E] text-xs tracking-[0.24em] text-center py-2 border-b border-[#3d3835]">
        {t("banner")}
      </div>

      <header className="sticky top-0 z-40 bg-[#1A1917]/95 backdrop-blur border-b border-[#3d3835]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 h-20 flex items-center justify-between gap-6">
          <Link to="/" data-testid="brand-logo" className="flex items-center gap-3">
            <span className="logo-mark" />
            <span className="font-serif-display text-2xl tracking-wider text-[#D4AF6E]">H'INFINI</span>
            <span className="hidden md:inline text-[10px] tracking-[0.3em] text-[#B8AE95] uppercase">Candles</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-7 text-sm">
            {NAV.map((n) => (
              <Link key={n.label} to={n.to} data-testid={`nav-${n.label.toLowerCase()}`} className="link-underline text-[#F0EAD6] hover:text-[#D4AF6E]">
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button onClick={toggle} data-testid="lang-toggle" title="Nyelv / Language" className="flex items-center gap-1 w-10 h-10 rounded-full hover:bg-[#24221E] text-lg" aria-label="Language">
              {lang === "hu" ? "🇭🇺" : "🇬🇧"}
            </button>
            <button onClick={() => nav("/shop")} data-testid="header-search-btn" className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#24221E]" aria-label="Search">
              <MagnifyingGlass size={18} className="text-[#F0EAD6]" />
            </button>
            <Link to="/discover" data-testid="header-discover" className="hidden md:flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#24221E]" aria-label="Discover">
              <Compass size={20} className="text-[#D4AF6E]" />
            </Link>
            <Link to="/cart" data-testid="nav-cart" className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#24221E]">
              <ShoppingBag size={22} className="text-[#F0EAD6]" />
              {count > 0 && <span data-testid="cart-count" className="absolute -top-1 -right-1 bg-[#D4AF6E] text-[#1A1917] text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{count}</span>}
            </Link>
            <button className="lg:hidden w-10 h-10 flex items-center justify-center" onClick={() => setOpen((o) => !o)} data-testid="mobile-menu-toggle" aria-label="Menu">
              {open ? <X size={22} /> : <List size={22} />}
            </button>
          </div>
        </div>
        {open && (
          <div className="lg:hidden border-t border-[#3d3835] px-6 py-4 space-y-3">
            {NAV.map((n) => (
              <Link key={n.label} to={n.to} onClick={() => setOpen(false)} className="block text-sm">{n.label}</Link>
            ))}
            <Link to="/admin" onClick={() => setOpen(false)} className="block text-sm text-[#D4AF6E]">Admin</Link>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-24 bg-[#0F0E0C] text-[#B8AE95] border-t border-[#3d3835]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="logo-mark" />
              <span className="font-serif-display text-2xl text-[#D4AF6E]">H'INFINI</span>
            </div>
            <p className="text-sm max-w-xs leading-relaxed">{t("footer.tagline")}</p>
          </div>
          <div>
            <div className="overline mb-4 text-[#D4AF6E]">{t("footer.shop")}</div>
            <ul className="space-y-2 text-sm">
              <li><Link to="/shop?category=Candles" className="link-underline">{t("nav.candles")}</Link></li>
              <li><Link to="/shop?category=Wax" className="link-underline">Wax</Link></li>
              <li><Link to="/shop?category=Fragrance%20Oils" className="link-underline">{t("nav.fragrances")}</Link></li>
              <li><Link to="/shop?category=Kits" className="link-underline">Kits</Link></li>
            </ul>
          </div>
          <div>
            <div className="overline mb-4 text-[#D4AF6E]">{t("footer.learn")}</div>
            <ul className="space-y-2 text-sm">
              <li><Link to="/learn/container-candle-method" className="link-underline">Container</Link></li>
              <li><Link to="/learn/fragrance-blending-basics" className="link-underline">Fragrance</Link></li>
              <li><Link to="/learn/candle-safety" className="link-underline">Safety</Link></li>
              <li><Link to="/admin" className="link-underline">Admin</Link></li>
            </ul>
          </div>
          <div>
            <div className="overline mb-4 text-[#D4AF6E]">{t("footer.notes")}</div>
            <p className="text-sm mb-3">{t("footer.notesDesc")}</p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="you@studio.com" data-testid="footer-email" className="flex-1 bg-transparent border-b border-[#3d3835] px-1 py-2 text-sm focus:outline-none focus:border-[#D4AF6E]" />
              <button data-testid="footer-submit" className="text-sm text-[#D4AF6E] uppercase tracking-widest">{t("footer.join")}</button>
            </form>
          </div>
        </div>
        <div className="border-t border-[#3d3835] py-6 text-xs text-center">
          © {new Date().getFullYear()} H'INFINI Candles · Lassan, tudatosan.
        </div>
      </footer>
    </div>
  );
}
