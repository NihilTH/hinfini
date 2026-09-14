import { createContext, useContext, useState, useEffect, useCallback } from "react";

import { hungarian } from "@/lib/hungarian";

const LangContext = createContext(null);
const KEY = "hi_lang";

const HU = {
  "nav.home": "Főoldal", "nav.about": "Bemutatkozás", "nav.custom": "Egyedi gyertyák", "nav.events": "Események", "nav.contact": "Elérhetőségek",
  "nav.shop": "Termékek", "nav.candles": "Gyertyák", "nav.fragrances": "Illatok", "nav.tools": "Eszközök",
   "nav.discover": "Felfedezés", "nav.admin": "Kezelőfelület", "nav.cart": "Kosár",
  "nav.menu": "Menü", "nav.close": "Bezárás", "nav.search": "Keresés", "nav.lang": "Nyelv",
  "banner": "INGYENES SZÁLLÍTÁS 25.000 FT FELETT — KÉZZEL ÖNTÖTT KIS SZÉRIÁKBAN",
  "hero.overline": "Kis szériás · Alapítva 2026", "hero.title1": "A gyertyakészítés", "hero.title2": "végtelen mesterei.",
  "hero.desc": "Kézzel öntött gyertyák, gondosan összeállított illatok és személyre szabott alkotások — otthonra, ajándékba, különleges alkalmakra.",
  "hero.shop": "Kollekció megtekintése",
  "brand.overline": "A H'INFINI-ről", "brand.title": "Végtelen türelem, kézzel öntve.",
  "brand.p1": "A H'INFINI egy kis műhely, ahol a gyertya nem tömegtermék, hanem lassú, figyelmes kézművesség. Minden darabot magunk öntünk, minden illatot magunk hangolunk.",
  "brand.p2": "Kész gyertyáink mellett egyedi elképzeléseket is megvalósítunk: választható illattal, tartóval és személyes szöveggel vagy képpel.",
  "brand.who": "Kiknek szól", "brand.whoDesc": "Otthonukat szebbé tevőknek, ajándékot keresőknek és a személyes részletek kedvelőinek.",
  "brand.what": "Mit kínálunk", "brand.whatDesc": "Gyertyák, illatviaszok, formagyertyák, asztali díszek és egyedi megrendelések.",
  "brand.why": "Mitől különleges", "brand.whyDesc": "Kis szériák, kézi öntés és személyre szabható részletek.",
  "featured.overline": "Kiemelt", "featured.title": "Kedvenceink", "featured.all": "Összes termék",
  "cats.overline": "Kategóriák", "cats.title": "Találd meg a hozzád illő darabot.", "cats.desc": "Kész gyertyák és díszek otthonra vagy ajándékba.",


  "tile.add": "Kosárba", "tile.soldOut": "Elfogyott", "tile.low": "Utolsó darabok",
  "stock.in": "Készleten", "stock.low": "Kevés készleten", "stock.out": "Elfogyott",
  "shop.title": "Termékek", "shop.all": "Összes", "shop.search": "Termékek keresése...", "shop.searchBtn": "Keres",
  "shop.empty": "Nincs találat.", "shop.sort": "Rendezés", "shop.sort.recommended": "Ajánlott", "shop.sort.price_asc": "Ár szerint növekvő",
  "shop.sort.price_desc": "Ár szerint csökkenő", "shop.sort.newest": "Legújabb", "shop.filters": "Szűrők", "shop.results": "{n} termék",
  "shop.loading": "Betöltés...",
  "pd.back": "Vissza: {cat}", "pd.stock": "Készlet", "pd.shipping": "Szállítás", "pd.shippingDesc": "Házhozszállítás 1990 Ft, 25.000 Ft felett ingyenes. Feladás 2–4 munkanapon belül.",
  "pd.desc": "Leírás", "pd.related": "Kapcsolódó termékek", "pd.add": "Kosárba", "pd.qty": "Mennyiség", "pd.notFound": "A termék nem található.",
  "pd.details": "Részletek", "pd.tags": "Címkék",
  "cart.overline": "A kosarad", "cart.emptyTitle": "A kosarad még üres.", "cart.emptyDesc": "Válassz egy gyertyát vagy díszt a termékek közül.",
  "cart.browse": "Böngészd a termékeket", "cart.ready": "A kiválasztott termékeid", "cart.subtotal": "Részösszeg", "cart.shipping": "Szállítási díj",
  "cart.free": "Ingyenes", "cart.total": "Végösszeg", "cart.freeMsg": "Adj hozzá még {n} Ft-ért az ingyenes szállításhoz.",
  "cart.checkout": "Tovább a pénztárhoz", "cart.remove": "Eltávolítás", "cart.qty": "Mennyiség", "cart.items": "Termékek", "cart.added": "kosárba téve",
  "cart.soldOut": "Ez a termék elfogyott.", "cart.maxStock": "Csak {n} db érhető el.", "cart.dec": "Kevesebb", "cart.inc": "Több",
  "co.title": "Hova küldjük?", "co.name": "Teljes név", "co.email": "E-mail", "co.phone": "Telefon", "co.address": "Cím (utca, házszám)",
  "co.city": "Város", "co.zip": "Irányítószám", "co.country": "Ország", "co.notes": "Megjegyzés (opcionális)",
  "co.submit": "Fizetés SimplePay-jel", "co.submitting": "Feldolgozás...", "co.summary": "A megrendelésed",
  "co.payInfo": "A fizetés a SimplePay biztonságos rendszerén keresztül történik, bankkártyával, forintban. Jelenleg tesztüzemmódban.",
  "co.shipMethod": "Szállítási mód", "co.ship.home": "Házhozszállítás", "co.ship.homeDesc": "Futárral a megadott címre, 2–4 munkanap.",
  "co.ship.pickup": "Csomagpont", "co.ship.pickupDesc": "Csomagpontos átvétel — fejlesztés alatt, egyelőre nem választható.", "co.ship.soon": "Fejlesztés alatt",
  "co.terms": "Elolvastam és elfogadom az", "co.termsLink": "ÁSZF-et", "co.and": "és az", "co.privacyLink": "Adatkezelési tájékoztatót", "co.termsReq": "A továbblépéshez el kell fogadnod az ÁSZF-et és az Adatkezelési tájékoztatót.",
  "co.newsletter": "Szeretnék hírlevelet kapni újdonságokról és eseményekről (nem kötelező).",
  "co.emptyCart": "A kosarad üres.", "co.failed": "A rendelés létrehozása nem sikerült. Kérlek próbáld újra.",
  "co.outOfStock": "Nincs elég készlet: {name}", "co.unavailable": "Egy termék már nem elérhető. Kérlek frissítsd a kosarat.",
  "co.reserved": "Rendelésed rögzítettük, a fizetési kapu jelenleg nem elérhető.", "co.legalNote": "A megrendelés elküldésével fizetési kötelezettség keletkezik.",
  "co.item": "Termék", "co.quantity": "Menny.",
  "order.thanks": "Köszönjük.", "order.recorded": "Rendelés rögzítve", "order.processing": "A fizetés feldolgozás alatt. A SimplePay visszaigazolását követően e-mailben értesítünk.",
  "order.reserved": "A rendelésed rögzítettük, de a fizetési kapu nem volt elérhető. Hamarosan felvesszük veled a kapcsolatot.",
  "order.paid": "Sikeres fizetés", "order.paidDesc": "A SimplePay visszaigazolta a fizetést. Hamarosan csomagoljuk a rendelésedet.",
  "order.failed": "A fizetés nem fejeződött be", "order.failedDesc": "A fizetés megszakadt vagy sikertelen volt. A rendelésed rögzítve maradt — írj nekünk, és segítünk.",
  "order.summary": "Összegzés", "order.continue": "Vásárlás folytatása", "order.status": "Állapot", "order.payment": "Fizetés",
  "order.pay.UNPAID": "Fizetésre vár", "order.pay.PAID": "Fizetve", "order.pay.FAILED": "Sikertelen", "order.pay.RESERVED": "Fizetés nélkül rögzítve",
  "order.notFound": "A rendelés nem található.", "order.ship": "Szállítási mód", "order.emailSent": "A rendelés-visszaigazolást a megadott e-mail-címre küldjük.",


  "disc.overline": "Felfedezés", "disc.title": "Bogarászd át a katalógust.", "disc.desc": "Véletlenszerű sorrend, minden termék megjelenik.", "disc.shuffle": "Új keverés",
  "footer.tagline": "Kézzel öntött gyertyák és személyre szabott ajándékok.", "footer.shop": "Termékek",  "footer.info": "Információk",
  "footer.notes": "Hírek a stúdióból", "footer.notesDesc": "Termékújdonságok, események és különleges ajánlatok.", "footer.join": "Feliratkozás",
  "footer.consent": "Hozzájárulok, hogy a megadott e-mail-címre hírlevelet küldjetek. Bármikor leiratkozhatok.", "footer.emailPh": "e-mail címed",
  "footer.subscribed": "Köszönjük, feliratkoztál!", "footer.already": "Ez az e-mail már fel van iratkozva.", "footer.consentReq": "A feliratkozáshoz add meg a hozzájárulást.",
  "footer.invalid": "Érvénytelen e-mail cím.", "footer.tagline2": "Lassan, tudatosan.",
  "legal.shipping": "Szállítás és fizetés", "legal.returns": "Elállás és visszaküldés", "legal.terms": "ÁSZF", "legal.privacy": "Adatkezelési tájékoztató", "legal.contact": "Elérhetőségek",
  "legal.template": "Szerkeszthető sablon — a szögletes zárójelben lévő adatokat a cég valós adataival kell kitölteni, jogi ellenőrzés után.",
  "err.generic": "Hiba történt. Kérlek próbáld újra.", "err.notFound": "Az oldal nem található.",
  "admin.title": "Kezelőfelület", "admin.enter": "Belépés", "admin.token": "Admin hozzáférési kulcs", "admin.badToken": "Sikertelen belépés. Ellenőrizd a hozzáférési kulcsot.",
  "admin.signOut": "Kilépés", "admin.prods": "Termékek", "admin.cats": "Kategóriák", "admin.orders": "Rendelések", "admin.media": "Médiatár",
  "admin.newsletter": "Hírlevél", "admin.emails": "E-mail napló", "admin.add": "Hozzáadás", "admin.edit": "Szerkesztés", "admin.del": "Törlés",
  "admin.save": "Mentés", "admin.cancel": "Mégse", "admin.saved": "Sikeresen mentve.", "admin.failed": "A mentés nem sikerült.",
  "admin.help": "Súgó",
};

const EN = {
  "nav.home": "Home", "nav.about": "About us", "nav.custom": "Custom candles", "nav.events": "Events", "nav.contact": "Contact",
  "nav.shop": "Shop", "nav.candles": "Candles", "nav.fragrances": "Fragrances", "nav.tools": "Tools",
   "nav.discover": "Discover", "nav.admin": "Kezelőfelület", "nav.cart": "Cart",
  "nav.menu": "Menu", "nav.close": "Close", "nav.search": "Search", "nav.lang": "Language",
  "banner": "FREE SHIPPING OVER 25,000 FT — HAND-POURED IN SMALL BATCHES",
  "hero.overline": "Small batch · Est. 2026", "hero.title1": "The infinite", "hero.title2": "craft of candle making.",
  "hero.desc": "Hand-poured candles, carefully composed scents and personalised creations for your home, gifts and special occasions.",
  "hero.shop": "Shop the collection",
  "brand.overline": "About H'INFINI", "brand.title": "Infinite patience, poured by hand.",
  "brand.p1": "H'INFINI is a small studio where a candle is not a mass product but slow, attentive craft. We pour every piece and tune every scent ourselves.",
  "brand.p2": "Alongside our ready-made candles, we bring personal ideas to life with your choice of scent, container, text or image.",
  "brand.who": "Who it's for", "brand.whoDesc": "For thoughtful homes, meaningful gifts and people who love personal details.",
  "brand.what": "What we offer", "brand.whatDesc": "Candles, wax melts, shaped candles, table decorations and custom creations.",
  "brand.why": "What makes it special", "brand.whyDesc": "Small batches, hand pouring and personalised details.",
  "featured.overline": "Featured", "featured.title": "Our favourites", "featured.all": "All products",
  "cats.overline": "Categories", "cats.title": "Find your favourite piece.", "cats.desc": "Ready-made candles and decorations for your home or as gifts.",


  "tile.add": "Add to cart", "tile.soldOut": "Sold out", "tile.low": "Last pieces",
  "stock.in": "In stock", "stock.low": "Low stock", "stock.out": "Sold out",
  "shop.title": "Products", "shop.all": "All", "shop.search": "Search products...", "shop.searchBtn": "Search",
  "shop.empty": "No products found.", "shop.sort": "Sort", "shop.sort.recommended": "Recommended", "shop.sort.price_asc": "Price: low to high",
  "shop.sort.price_desc": "Price: high to low", "shop.sort.newest": "Newest", "shop.filters": "Filters", "shop.results": "{n} products",
  "shop.loading": "Loading...",
  "pd.back": "Back to {cat}", "pd.stock": "Stock", "pd.shipping": "Shipping", "pd.shippingDesc": "Home delivery 1,990 Ft, free over 25,000 Ft. Dispatched within 2–4 business days.",
  "pd.desc": "Description", "pd.related": "Related products", "pd.add": "Add to cart", "pd.qty": "Quantity", "pd.notFound": "Product not found.",
  "pd.details": "Details", "pd.tags": "Tags",
  "cart.overline": "Your cart", "cart.emptyTitle": "Your cart is empty.", "cart.emptyDesc": "Choose a candle or decoration from our products.",
  "cart.browse": "Browse the shop", "cart.ready": "Your selected products", "cart.subtotal": "Subtotal", "cart.shipping": "Shipping",
  "cart.free": "Free", "cart.total": "Total", "cart.freeMsg": "Add {n} Ft more for free shipping.",
  "cart.checkout": "Proceed to checkout", "cart.remove": "Remove", "cart.qty": "Quantity", "cart.items": "Items", "cart.added": "added to cart",
  "cart.soldOut": "This product is sold out.", "cart.maxStock": "Only {n} available.", "cart.dec": "Less", "cart.inc": "More",
  "co.title": "Where should we send it?", "co.name": "Full name", "co.email": "Email", "co.phone": "Phone", "co.address": "Address (street, number)",
  "co.city": "City", "co.zip": "Postal code", "co.country": "Country", "co.notes": "Notes (optional)",
  "co.submit": "Pay with SimplePay", "co.submitting": "Processing...", "co.summary": "Your order",
  "co.payInfo": "Payment is processed securely via SimplePay by card, in HUF. Currently in test (sandbox) mode.",
  "co.shipMethod": "Shipping method", "co.ship.home": "Home delivery", "co.ship.homeDesc": "Courier to your address, 2–4 business days.",
  "co.ship.pickup": "Parcel point", "co.ship.pickupDesc": "Parcel point pickup — under development, not yet available.", "co.ship.soon": "Coming soon",
  "co.terms": "I have read and accept the", "co.termsLink": "Terms & Conditions", "co.and": "and the", "co.privacyLink": "Privacy Policy", "co.termsReq": "You must accept the Terms and the Privacy Policy to continue.",
  "co.newsletter": "Send me news about products and events (optional).",
  "co.emptyCart": "Your cart is empty.", "co.failed": "Could not create the order. Please try again.",
  "co.outOfStock": "Not enough stock: {name}", "co.unavailable": "A product is no longer available. Please refresh your cart.",
  "co.reserved": "Your order is recorded, but the payment gateway is currently unavailable.", "co.legalNote": "Placing the order creates a payment obligation.",
  "co.item": "Item", "co.quantity": "Qty",
  "order.thanks": "Thank you.", "order.recorded": "Order recorded", "order.processing": "Payment is being processed. We'll email you once SimplePay confirms it.",
  "order.reserved": "Your order is recorded, but the payment gateway was unavailable. We'll contact you shortly.",
  "order.paid": "Payment successful", "order.paidDesc": "SimplePay has confirmed your payment. We'll pack your order soon.",
  "order.failed": "Payment not completed", "order.failedDesc": "The payment was cancelled or failed. Your order is still recorded — contact us and we'll help.",
  "order.summary": "Summary", "order.continue": "Continue shopping", "order.status": "Status", "order.payment": "Payment",
  "order.pay.UNPAID": "Awaiting payment", "order.pay.PAID": "Paid", "order.pay.FAILED": "Failed", "order.pay.RESERVED": "Recorded without payment",
  "order.notFound": "Order not found.", "order.ship": "Shipping method", "order.emailSent": "An order confirmation has been emailed to you.",


  "disc.overline": "Discover", "disc.title": "Browse the whole catalogue.", "disc.desc": "Random order, every product appears.", "disc.shuffle": "Shuffle again",
  "footer.tagline": "Hand-poured candles and personalised gifts.", "footer.shop": "Shop",  "footer.info": "Information",
  "footer.notes": "Notes from the studio", "footer.notesDesc": "New products, events and special offers.", "footer.join": "Subscribe",
  "footer.consent": "I agree to receive the newsletter at this email address. I can unsubscribe anytime.", "footer.emailPh": "your email",
  "footer.subscribed": "Thank you, you're subscribed!", "footer.already": "This email is already subscribed.", "footer.consentReq": "Please give consent to subscribe.",
  "footer.invalid": "Invalid email address.", "footer.tagline2": "Slowly, consciously.",
  "legal.shipping": "Shipping & payment", "legal.returns": "Withdrawal & returns", "legal.terms": "Terms & Conditions", "legal.privacy": "Privacy Policy", "legal.contact": "Contact",
  "legal.template": "Editable template — replace bracketed placeholders with real company data after legal review.",
  "err.generic": "Something went wrong. Please try again.", "err.notFound": "Page not found.",
  "admin.title": "Admin panel", "admin.enter": "Enter", "admin.token": "Admin access key", "admin.badToken": "Login failed. Check the access key.",
  "admin.signOut": "Sign out", "admin.prods": "Products", "admin.cats": "Categories", "admin.orders": "Orders", "admin.media": "Media library",
  "admin.newsletter": "Newsletter", "admin.emails": "Email log", "admin.add": "Add", "admin.edit": "Edit", "admin.del": "Delete",
  "admin.save": "Save", "admin.cancel": "Cancel", "admin.saved": "Saved successfully.", "admin.failed": "Save failed.",
  "admin.help": "Help",
};

const DICT = { hu: HU, en: EN };

export const LangProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem(KEY) === "en" ? "en" : "hu");
  useEffect(() => { localStorage.setItem(KEY, lang); document.documentElement.lang = lang; }, [lang]);
  const t = useCallback((k, vars) => {
    let s = DICT[lang][k] ?? DICT.hu[k] ?? k;
    if (vars) Object.entries(vars).forEach(([kk, v]) => { s = s.replace(`{${kk}}`, v); });
    return s;
  }, [lang]);
  const tr = useCallback((obj, field) => {
    if (!obj) return "";
    if (lang === "en" && obj[`${field}_en`]) return obj[`${field}_en`];
    return lang === "hu" ? hungarian(obj[`${field}_hu`] || obj[field]) : obj[field] || "";
  }, [lang]);
  const catName = useCallback((c) => {
    if (!c) return "";
    if (typeof c === "string") return lang === "hu" ? hungarian(c) : c;
    return (lang === "hu" ? c.name_hu : c.name_en) || (lang === "hu" ? hungarian(c.name) : c.name);
  }, [lang]);
  const label = useCallback((value) => lang === "hu" ? hungarian(value) : value, [lang]);
  const toggle = () => setLang((l) => (l === "hu" ? "en" : "hu"));
  return <LangContext.Provider value={{ lang, t, tr, catName, label, toggle, setLang }}>{children}</LangContext.Provider>;
};

export const useLang = () => useContext(LangContext);

export const formatPrice = (huf) => new Intl.NumberFormat("hu-HU").format(huf || 0) + " Ft";
