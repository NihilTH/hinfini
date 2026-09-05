import { createContext, useContext, useState, useEffect } from "react";

const LangContext = createContext(null);
const KEY = "hi_lang";

const DICT = {
  hu: {
    "nav.shop": "Bolt", "nav.candles": "Gyertyák", "nav.fragrances": "Illatok",
    "nav.tools": "Eszközök", "nav.learn": "Tanulj", "nav.discover": "Felfedezés",
    "nav.admin": "Admin", "nav.cart": "Kosár",
    "hero.overline": "Kis szériás · Alapítva 2026",
    "hero.title1": "A gyertyakészítés", "hero.title2": "végtelen mesterei.",
    "hero.desc": "Kézzel öntött gyertyák, parfümőri illatok és minden, amire egy készítőnek szüksége lehet — kiegészítve részletes útmutatókkal.",
    "hero.shop": "Kollekció megtekintése", "hero.learn": "Ismerd meg a mesterséget",
    "featured.overline": "Kiemelt", "featured.title": "Kedvenceink",
    "cats.overline": "Kategóriák", "cats.title": "Minden, ami a készítőnek kell.",
    "cats.desc": "Viasztól, kanóctól, illatoktól a hőmérőkig — gonddal válogatva.",
    "methods.overline": "Módszerek & technikák",
    "methods.title1": "Edény, mártott, pillér, gél —",
    "methods.title2": "útmutató minden öntéshez.",
    "methods.desc": "Hét részletes útmutató végigvezet minden módszeren, kanóc méretezésen és biztonságon.",
    "methods.cta": "Fedezd fel az útmutatókat",
    "shop.title": "Minden a gyertyakészítéshez", "shop.all": "Összes",
    "shop.search": "Termékek keresése...", "shop.searchBtn": "Keres",
    "shop.empty": "Nincs találat.",
    "cart.overline": "A kosarad", "cart.emptyTitle": "Egy csendes munkapad.",
    "cart.emptyDesc": "Még semmi — keress egy viaszt, amit szeretsz.", "cart.browse": "Böngészd a boltot",
    "cart.ready": "Készen áll az öntésre", "cart.subtotal": "Részösszeg",
    "cart.shipping": "Szállítás", "cart.free": "Ingyenes", "cart.total": "Összesen",
    "cart.freeMsg": "Adj hozzá még {n} Ft-ért az ingyenes szállításhoz.",
    "cart.checkout": "Fizetés",
    "co.title": "Hova küldjük?", "co.name": "Teljes név", "co.email": "E-mail",
    "co.phone": "Telefon", "co.address": "Cím", "co.city": "Város",
    "co.zip": "Irányítószám", "co.country": "Ország", "co.notes": "Megjegyzés (opcionális)",
    "co.submit": "Fizetés SimplePay-jel", "co.submitting": "Feldolgozás...",
    "co.payInfo": "A fizetés SimplePay biztonságos rendszerén keresztül történik. Bankkártyás fizetés HUF-ban.",
    "co.summary": "A megrendelésed", "learn.overline": "A könyvtár",
    "learn.title1": "Tanuld meg a", "learn.title2": "gyertyakészítés mesterségét.",
    "learn.desc": "Készítők írták, stúdióban tesztelt. Módszerek, technikák, biztonság.",
    "disc.overline": "Felfedezés", "disc.title": "Bogarászd át a katalógust.",
    "disc.desc": "Véletlenszerű sorrend, minden termék megjelenik.",
    "disc.shuffle": "Új keverés",
    "order.thanks": "Köszönjük.", "order.pending": "A rendelésed feldolgozás alatt.",
    "order.reserved": "A rendelésed le van foglalva. Hamarosan felvesszük veled a kapcsolatot.",
    "order.paid": "Fizetés sikeres!", "order.failed": "A fizetés sikertelen. Kérlek próbáld újra.",
    "order.summary": "Összegzés", "order.continue": "Vásárlás folytatása",
    "footer.tagline": "Kis szériás gyertyakészítő kellékek és lassú mesterség oktatás.",
    "footer.shop": "Bolt", "footer.learn": "Tanulj", "footer.notes": "Hírek a stúdióból",
    "footer.notesDesc": "Receptek, tippek és megjelenés bejelentések — havonta kétszer.",
    "footer.join": "Feliratkozás",
    "admin.title": "Admin panel", "admin.enter": "Belépés",
    "admin.token": "Admin token", "admin.cats": "Kategóriák",
    "admin.prods": "Termékek", "admin.add": "Hozzáadás",
    "admin.edit": "Szerkesztés", "admin.del": "Törlés",
    "admin.save": "Mentés", "admin.cancel": "Mégse",
    "banner": "INGYENES SZÁLLÍTÁS 25.000 FT FELETT — KÉZZEL ÖNTÖTT KIS SZÉRIÁKBAN",
  },
  en: {
    "nav.shop": "Shop", "nav.candles": "Candles", "nav.fragrances": "Fragrances",
    "nav.tools": "Tools", "nav.learn": "Learn", "nav.discover": "Discover",
    "nav.admin": "Admin", "nav.cart": "Cart",
    "hero.overline": "Small batch · Est. 2026",
    "hero.title1": "The infinite", "hero.title2": "craft of candle making.",
    "hero.desc": "Hand-poured candles, perfumer-grade fragrances and everything a maker needs — paired with generous guides.",
    "hero.shop": "Shop the collection", "hero.learn": "Learn the craft",
    "featured.overline": "Featured", "featured.title": "Our favourites",
    "cats.overline": "Categories", "cats.title": "Everything the maker needs.",
    "cats.desc": "From wax and wicks to fragrances and thermometers — sourced with care.",
    "methods.overline": "Methods & techniques", "methods.title1": "Container, taper, pillar, gel —",
    "methods.title2": "the guide for every pour.",
    "methods.desc": "Seven deep guides walk you through each method, wick sizing and safety.",
    "methods.cta": "Explore the guides",
    "shop.title": "Everything for the pour", "shop.all": "All",
    "shop.search": "Search products...", "shop.searchBtn": "Search",
    "shop.empty": "No products found.",
    "cart.overline": "Your cart", "cart.emptyTitle": "A quiet workbench.",
    "cart.emptyDesc": "Nothing here yet — find a wax you love.", "cart.browse": "Browse the shop",
    "cart.ready": "Ready to pour", "cart.subtotal": "Subtotal",
    "cart.shipping": "Shipping", "cart.free": "Free", "cart.total": "Total",
    "cart.freeMsg": "Add {n} Ft more for free shipping.",
    "cart.checkout": "Checkout",
    "co.title": "Where should we send it?", "co.name": "Full name", "co.email": "Email",
    "co.phone": "Phone", "co.address": "Address", "co.city": "City",
    "co.zip": "Postal code", "co.country": "Country", "co.notes": "Notes (optional)",
    "co.submit": "Pay with SimplePay", "co.submitting": "Processing...",
    "co.payInfo": "Payment is processed securely via SimplePay. Card payments in HUF.",
    "co.summary": "Your order", "learn.overline": "The library",
    "learn.title1": "Learn the", "learn.title2": "craft of candle making.",
    "learn.desc": "Written by chandlers, tested in the studio.",
    "disc.overline": "Discover", "disc.title": "Browse the whole catalogue.",
    "disc.desc": "Random order, every product appears.",
    "disc.shuffle": "Shuffle again",
    "order.thanks": "Thank you.", "order.pending": "Your order is being processed.",
    "order.reserved": "Your order is reserved. We'll reach out shortly.",
    "order.paid": "Payment successful!", "order.failed": "Payment failed. Please try again.",
    "order.summary": "Summary", "order.continue": "Continue shopping",
    "footer.tagline": "Small-batch candle-making supplies and slow craft education.",
    "footer.shop": "Shop", "footer.learn": "Learn", "footer.notes": "Notes from the studio",
    "footer.notesDesc": "Recipes, tips and drop announcements — twice a month.",
    "footer.join": "Join",
    "admin.title": "Admin panel", "admin.enter": "Enter",
    "admin.token": "Admin token", "admin.cats": "Categories",
    "admin.prods": "Products", "admin.add": "Add",
    "admin.edit": "Edit", "admin.del": "Delete",
    "admin.save": "Save", "admin.cancel": "Cancel",
    "banner": "FREE SHIPPING OVER 25,000 FT — HAND-POURED IN SMALL BATCHES",
  },
};

export const LangProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem(KEY) || "hu");
  useEffect(() => { localStorage.setItem(KEY, lang); }, [lang]);
  const t = (k, vars) => {
    let s = DICT[lang][k] || DICT.en[k] || k;
    if (vars) Object.entries(vars).forEach(([kk, v]) => { s = s.replace(`{${kk}}`, v); });
    return s;
  };
  const toggle = () => setLang((l) => l === "hu" ? "en" : "hu");
  return <LangContext.Provider value={{ lang, t, toggle, setLang }}>{children}</LangContext.Provider>;
};

export const useLang = () => useContext(LangContext);

export const formatPrice = (huf) => new Intl.NumberFormat('hu-HU').format(huf) + ' Ft';
