import { createContext, useContext, useState, useEffect, useCallback } from "react";

const LangContext = createContext(null);
const KEY = "hi_lang";

const HU = {
  "nav.shop": "Bolt", "nav.candles": "Gyertyák", "nav.fragrances": "Illatok", "nav.tools": "Eszközök",
  "nav.learn": "Tanulj", "nav.discover": "Felfedezés", "nav.admin": "Admin", "nav.cart": "Kosár",
  "nav.menu": "Menü", "nav.close": "Bezárás", "nav.search": "Keresés", "nav.lang": "Nyelv",
  "banner": "INGYENES SZÁLLÍTÁS 25.000 FT FELETT — KÉZZEL ÖNTÖTT KIS SZÉRIÁKBAN",
  "hero.overline": "Kis szériás · Alapítva 2026", "hero.title1": "A gyertyakészítés", "hero.title2": "végtelen mesterei.",
  "hero.desc": "Kézzel öntött gyertyák, parfümőri illatok és minden, amire egy készítőnek szüksége lehet — kiegészítve részletes útmutatókkal.",
  "hero.shop": "Kollekció megtekintése", "hero.learn": "Ismerd meg a mesterséget",
  "brand.overline": "A H'INFINI-ről", "brand.title": "Végtelen türelem, kézzel öntve.",
  "brand.p1": "A H'INFINI egy kis műhely, ahol a gyertya nem tömegtermék, hanem lassú, figyelmes kézművesség. Minden darabot magunk öntünk, minden illatot magunk hangolunk.",
  "brand.p2": "Nem csak gyertyát adunk — az egész mesterséget: viaszt, kanócot, edényt, illatot és a tudást, hogyan válik ezekből valami tartós.",
  "brand.who": "Kiknek szól", "brand.whoDesc": "Otthonukat tudatosan berendezőknek, ajándékot keresőknek és mindenkinek, aki maga szeretne gyertyát önteni — kezdőtől a haladóig.",
  "brand.what": "Mit kínálunk", "brand.whatDesc": "Kész gyertyák, prémium viaszok, ftalátmentes illatolajok, 100% tiszta illóolajok, kanócok, edények, eszközök és kezdő szettek.",
  "brand.why": "Mitől különleges", "brand.whyDesc": "Kis szériák, kézi öntés, természetes alapanyagok, HUF-ban árazott átlátható kínálat és ingyenes, részletes útmutatók minden módszerhez.",
  "featured.overline": "Kiemelt", "featured.title": "Kedvenceink", "featured.all": "Összes termék",
  "cats.overline": "Kategóriák", "cats.title": "Minden, ami a készítőnek kell.", "cats.desc": "Viasztól, kanóctól, illatoktól a hőmérőkig — gonddal válogatva.",
  "methods.overline": "Módszerek & technikák", "methods.title1": "Edény, mártott, pillér, gél —", "methods.title2": "útmutató minden öntéshez.",
  "methods.desc": "Hét részletes útmutató végigvezet minden módszeren, kanóc méretezésen és biztonságon.", "methods.cta": "Fedezd fel az útmutatókat",
  "tile.add": "Kosárba", "tile.soldOut": "Elfogyott", "tile.low": "Utolsó darabok",
  "stock.in": "Készleten", "stock.low": "Kevés készleten", "stock.out": "Elfogyott",
  "shop.title": "Minden a gyertyakészítéshez", "shop.all": "Összes", "shop.search": "Termékek keresése...", "shop.searchBtn": "Keres",
  "shop.empty": "Nincs találat.", "shop.sort": "Rendezés", "shop.sort.recommended": "Ajánlott", "shop.sort.price_asc": "Ár szerint növekvő",
  "shop.sort.price_desc": "Ár szerint csökkenő", "shop.sort.newest": "Legújabb", "shop.filters": "Szűrők", "shop.results": "{n} termék",
  "shop.loading": "Betöltés...",
  "pd.back": "Vissza: {cat}", "pd.stock": "Készlet", "pd.shipping": "Szállítás", "pd.shippingDesc": "Házhozszállítás 1990 Ft, 25.000 Ft felett ingyenes. Feladás 2–4 munkanapon belül.",
  "pd.desc": "Leírás", "pd.related": "Kapcsolódó termékek", "pd.add": "Kosárba", "pd.qty": "Mennyiség", "pd.notFound": "A termék nem található.",
  "pd.details": "Részletek", "pd.tags": "Címkék",
  "cart.overline": "A kosarad", "cart.emptyTitle": "Egy csendes munkapad.", "cart.emptyDesc": "Még semmi — keress egy viaszt, amit szeretsz.",
  "cart.browse": "Böngészd a boltot", "cart.ready": "Készen áll az öntésre", "cart.subtotal": "Részösszeg", "cart.shipping": "Szállítási díj",
  "cart.free": "Ingyenes", "cart.total": "Végösszeg", "cart.freeMsg": "Adj hozzá még {n} Ft-ért az ingyenes szállításhoz.",
  "cart.checkout": "Tovább a pénztárhoz", "cart.remove": "Eltávolítás", "cart.qty": "Mennyiség", "cart.items": "Termékek", "cart.added": "kosárba téve",
  "cart.soldOut": "Ez a termék elfogyott.", "cart.maxStock": "Csak {n} db érhető el.", "cart.dec": "Kevesebb", "cart.inc": "Több",
  "co.title": "Hova küldjük?", "co.name": "Teljes név", "co.email": "E-mail", "co.phone": "Telefon", "co.address": "Cím (utca, házszám)",
  "co.city": "Város", "co.zip": "Irányítószám", "co.country": "Ország", "co.notes": "Megjegyzés (opcionális)",
  "co.submit": "Fizetés SimplePay-jel", "co.submitting": "Feldolgozás...", "co.summary": "A megrendelésed",
  "co.payInfo": "A fizetés a SimplePay biztonságos rendszerén keresztül történik, bankkártyával, HUF-ban. Jelenleg teszt (sandbox) mód.",
  "co.shipMethod": "Szállítási mód", "co.ship.home": "Házhozszállítás", "co.ship.homeDesc": "Futárral a megadott címre, 2–4 munkanap.",
  "co.ship.pickup": "Csomagpont", "co.ship.pickupDesc": "Csomagpontos átvétel — fejlesztés alatt, egyelőre nem választható.", "co.ship.soon": "Fejlesztés alatt",
  "co.terms": "Elolvastam és elfogadom az", "co.termsLink": "ÁSZF-et", "co.and": "és az", "co.privacyLink": "Adatkezelési tájékoztatót", "co.termsReq": "A továbblépéshez el kell fogadnod az ÁSZF-et és az Adatkezelési tájékoztatót.",
  "co.newsletter": "Szeretnék hírlevelet kapni új termékekről és útmutatókról (nem kötelező).",
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
  "order.notFound": "A rendelés nem található.", "order.ship": "Szállítási mód", "order.emailSent": "A rendelés visszaigazolását e-mailben elküldtük.",
  "learn.overline": "A könyvtár", "learn.title1": "Tanuld meg a", "learn.title2": "gyertyakészítés mesterségét.",
  "learn.desc": "Készítők írták, stúdióban tesztelt. Módszerek, technikák, biztonság.", "learn.min": "perc", "learn.back": "Útmutatók", "learn.read": "Elolvasom",
  "disc.overline": "Felfedezés", "disc.title": "Bogarászd át a katalógust.", "disc.desc": "Véletlenszerű sorrend, minden termék megjelenik.", "disc.shuffle": "Új keverés",
  "footer.tagline": "Kis szériás gyertyakészítő kellékek és lassú mesterség oktatás.", "footer.shop": "Bolt", "footer.learn": "Tanulj", "footer.info": "Információk",
  "footer.notes": "Hírek a stúdióból", "footer.notesDesc": "Receptek, tippek és megjelenés bejelentések — havonta kétszer.", "footer.join": "Feliratkozás",
  "footer.consent": "Hozzájárulok, hogy a megadott e-mail-címre hírlevelet küldjetek. Bármikor leiratkozhatok.", "footer.emailPh": "e-mail címed",
  "footer.subscribed": "Köszönjük, feliratkoztál!", "footer.already": "Ez az e-mail már fel van iratkozva.", "footer.consentReq": "A feliratkozáshoz add meg a hozzájárulást.",
  "footer.invalid": "Érvénytelen e-mail cím.", "footer.tagline2": "Lassan, tudatosan.",
  "legal.shipping": "Szállítás és fizetés", "legal.returns": "Elállás és visszaküldés", "legal.terms": "ÁSZF", "legal.privacy": "Adatkezelési tájékoztató", "legal.contact": "Kapcsolat",
  "legal.template": "Szerkeszthető sablon — a szögletes zárójelben lévő adatokat a cég valós adataival kell kitölteni, jogi ellenőrzés után.",
  "err.generic": "Hiba történt. Kérlek próbáld újra.", "err.notFound": "Az oldal nem található.",
  "admin.title": "Admin felület", "admin.enter": "Belépés", "admin.token": "Admin hozzáférési kulcs", "admin.badToken": "Sikertelen belépés. Ellenőrizd a hozzáférési kulcsot.",
  "admin.signOut": "Kilépés", "admin.prods": "Termékek", "admin.cats": "Kategóriák", "admin.orders": "Rendelések", "admin.media": "Médiatár",
  "admin.newsletter": "Hírlevél", "admin.emails": "E-mail napló", "admin.add": "Hozzáadás", "admin.edit": "Szerkesztés", "admin.del": "Törlés",
  "admin.save": "Mentés", "admin.cancel": "Mégse", "admin.saved": "Sikeresen mentve.", "admin.failed": "A mentés nem sikerült.",
  "admin.help": "Súgó",
};

const EN = {
  "nav.shop": "Shop", "nav.candles": "Candles", "nav.fragrances": "Fragrances", "nav.tools": "Tools",
  "nav.learn": "Learn", "nav.discover": "Discover", "nav.admin": "Admin", "nav.cart": "Cart",
  "nav.menu": "Menu", "nav.close": "Close", "nav.search": "Search", "nav.lang": "Language",
  "banner": "FREE SHIPPING OVER 25,000 FT — HAND-POURED IN SMALL BATCHES",
  "hero.overline": "Small batch · Est. 2026", "hero.title1": "The infinite", "hero.title2": "craft of candle making.",
  "hero.desc": "Hand-poured candles, perfumer-grade fragrances and everything a maker needs — paired with generous guides.",
  "hero.shop": "Shop the collection", "hero.learn": "Learn the craft",
  "brand.overline": "About H'INFINI", "brand.title": "Infinite patience, poured by hand.",
  "brand.p1": "H'INFINI is a small studio where a candle is not a mass product but slow, attentive craft. We pour every piece and tune every scent ourselves.",
  "brand.p2": "We don't just sell candles — we share the whole craft: wax, wick, vessel, fragrance and the knowledge of how they become something lasting.",
  "brand.who": "Who it's for", "brand.whoDesc": "For people who furnish their home with intention, gift-seekers, and anyone who wants to pour their own candles — from beginner to advanced.",
  "brand.what": "What we offer", "brand.whatDesc": "Finished candles, premium waxes, phthalate-free fragrance oils, 100% pure essential oils, wicks, vessels, tools and starter kits.",
  "brand.why": "What makes it special", "brand.whyDesc": "Small batches, hand pouring, natural materials, transparent HUF pricing and free in-depth guides for every method.",
  "featured.overline": "Featured", "featured.title": "Our favourites", "featured.all": "All products",
  "cats.overline": "Categories", "cats.title": "Everything the maker needs.", "cats.desc": "From wax and wicks to fragrances and thermometers — sourced with care.",
  "methods.overline": "Methods & techniques", "methods.title1": "Container, taper, pillar, gel —", "methods.title2": "the guide for every pour.",
  "methods.desc": "Seven deep guides walk you through each method, wick sizing and safety.", "methods.cta": "Explore the guides",
  "tile.add": "Add to cart", "tile.soldOut": "Sold out", "tile.low": "Last pieces",
  "stock.in": "In stock", "stock.low": "Low stock", "stock.out": "Sold out",
  "shop.title": "Everything for the pour", "shop.all": "All", "shop.search": "Search products...", "shop.searchBtn": "Search",
  "shop.empty": "No products found.", "shop.sort": "Sort", "shop.sort.recommended": "Recommended", "shop.sort.price_asc": "Price: low to high",
  "shop.sort.price_desc": "Price: high to low", "shop.sort.newest": "Newest", "shop.filters": "Filters", "shop.results": "{n} products",
  "shop.loading": "Loading...",
  "pd.back": "Back to {cat}", "pd.stock": "Stock", "pd.shipping": "Shipping", "pd.shippingDesc": "Home delivery 1,990 Ft, free over 25,000 Ft. Dispatched within 2–4 business days.",
  "pd.desc": "Description", "pd.related": "Related products", "pd.add": "Add to cart", "pd.qty": "Quantity", "pd.notFound": "Product not found.",
  "pd.details": "Details", "pd.tags": "Tags",
  "cart.overline": "Your cart", "cart.emptyTitle": "A quiet workbench.", "cart.emptyDesc": "Nothing here yet — find a wax you love.",
  "cart.browse": "Browse the shop", "cart.ready": "Ready to pour", "cart.subtotal": "Subtotal", "cart.shipping": "Shipping",
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
  "co.newsletter": "I'd like to receive the newsletter about new products and guides (optional).",
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
  "learn.overline": "The library", "learn.title1": "Learn the", "learn.title2": "craft of candle making.",
  "learn.desc": "Written by chandlers, tested in the studio.", "learn.min": "min", "learn.back": "Guides", "learn.read": "Read",
  "disc.overline": "Discover", "disc.title": "Browse the whole catalogue.", "disc.desc": "Random order, every product appears.", "disc.shuffle": "Shuffle again",
  "footer.tagline": "Small-batch candle-making supplies and slow craft education.", "footer.shop": "Shop", "footer.learn": "Learn", "footer.info": "Information",
  "footer.notes": "Notes from the studio", "footer.notesDesc": "Recipes, tips and drop announcements — twice a month.", "footer.join": "Subscribe",
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
  const [lang, setLang] = useState(() => localStorage.getItem(KEY) || "hu");
  useEffect(() => { localStorage.setItem(KEY, lang); document.documentElement.lang = lang; }, [lang]);
  const t = useCallback((k, vars) => {
    let s = DICT[lang][k] ?? DICT.hu[k] ?? k;
    if (vars) Object.entries(vars).forEach(([kk, v]) => { s = s.replace(`{${kk}}`, v); });
    return s;
  }, [lang]);
  const tr = useCallback((obj, field) => {
    if (!obj) return "";
    if (lang === "en" && obj[`${field}_en`]) return obj[`${field}_en`];
    return obj[field] || "";
  }, [lang]);
  const catName = useCallback((c) => {
    if (!c) return "";
    if (typeof c === "string") return c;
    return (lang === "hu" ? c.name_hu : c.name_en) || c.name;
  }, [lang]);
  const toggle = () => setLang((l) => (l === "hu" ? "en" : "hu"));
  return <LangContext.Provider value={{ lang, t, tr, catName, toggle, setLang }}>{children}</LangContext.Provider>;
};

export const useLang = () => useContext(LangContext);

export const formatPrice = (huf) => new Intl.NumberFormat("hu-HU").format(huf || 0) + " Ft";
