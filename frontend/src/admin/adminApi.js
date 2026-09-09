import api from "@/lib/api";
import { useLang } from "@/context/LangContext";

export const TOKEN_KEY = "hi_admin_token";
export const getToken = () => sessionStorage.getItem(TOKEN_KEY) || "";
export const setToken = (t) => (t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY));
const h = () => ({ headers: { "X-Admin-Token": getToken() } });

export const adminApi = {
  verify: (token) => api.post("/admin/verify", null, { headers: { "X-Admin-Token": token } }),
  stats: () => api.get("/admin/stats", h()),
  products: (archived = false) => api.get("/admin/products", { ...h(), params: { include_archived: archived } }),
  createProduct: (b) => api.post("/admin/products", b, h()),
  updateProduct: (id, b) => api.put(`/admin/products/${id}`, b, h()),
  archiveProduct: (id) => api.post(`/admin/products/${id}/archive`, null, h()),
  bulk: (b) => api.post("/admin/products/bulk", b, h()),
  categories: () => api.get("/admin/categories", h()),
  createCategory: (b) => api.post("/admin/categories", b, h()),
  updateCategory: (name, b) => api.put(`/admin/categories/${encodeURIComponent(name)}`, b, h()),
  reorderCategories: (names) => api.post("/admin/categories/reorder", { names }, h()),
  deleteCategory: (name) => api.delete(`/admin/categories/${encodeURIComponent(name)}`, h()),
  media: () => api.get("/admin/media", h()),
  upload: (file, alt) => { const fd = new FormData(); fd.append("file", file); fd.append("alt", alt || ""); return api.post("/admin/media/upload", fd, h()); },
  patchMedia: (id, alt) => api.patch(`/admin/media/${id}`, { alt }, h()),
  deleteMedia: (id) => api.delete(`/admin/media/${id}`, h()),
  orders: (params) => api.get("/admin/orders", { ...h(), params }),
  order: (id) => api.get(`/admin/orders/${id}`, h()),
  orderStatus: (id, b) => api.patch(`/admin/orders/${id}/status`, b, h()),
  orderInvoice: (id, b) => api.patch(`/admin/orders/${id}/invoice`, b, h()),
  newsletter: () => api.get("/admin/newsletter", h()),
  deleteSubscriber: (email) => api.delete(`/admin/newsletter/${encodeURIComponent(email)}`, h()),
  emails: (order_id) => api.get("/admin/emails", { ...h(), params: order_id ? { order_id } : {} }),
  resendEmail: (id) => api.post(`/admin/emails/${id}/resend`, null, h()),
};

const A = {
  hu: {
    dashboard: "Áttekintés", products: "Termékek", categories: "Kategóriák", orders: "Rendelések", media: "Médiatár", newsletter: "Hírlevél", emails: "E-mail napló",
    search: "Keresés…", all: "Összes", add: "Új termék", addCat: "Új kategória", edit: "Szerkesztés", save: "Mentés", cancel: "Mégse", close: "Bezárás",
    saved: "Sikeresen mentve.", failed: "Hiba történt. Kérlek ellenőrizd az adatokat.", confirm: "Megerősítés", yes: "Igen", no: "Nem",
    status: "Állapot", published: "Publikált", draft: "Piszkozat", hidden: "Elrejtve", archived: "Archivált", archive: "Archiválás",
    archiveConfirm: "Biztosan archiválod ezt a terméket? A vásárlók nem látják többé, a régi rendelések adatai megmaradnak.",
    bulk: "Tömeges művelet", selected: "{n} kijelölve", publish: "Publikálás", hide: "Elrejtés", setCategory: "Kategória módosítása", apply: "Alkalmaz",
    name: "Név", price: "Ár", stock: "Készlet", category: "Kategória", featured: "Kiemelt", actions: "Műveletek", sort: "Rendezés",
    sortName: "Név", sortPrice: "Ár", sortStock: "Készlet", sortNewest: "Legújabb", showArchived: "Archiváltak mutatása",
    stockIn: "Készleten", stockLow: "Kevés", stockOut: "Elfogyott",
    // editor
    basics: "Alapadatok", sales: "Értékesítés", content: "Tartalom", images: "Képek", preview: "Előnézet",
    nameHu: "Név (magyar)", nameEn: "Név (angol)", slug: "URL azonosító", slugHelp: "Csak kisbetű, szám és kötőjel. Pl.: levendula-szoja-gyertya", slugGen: "Generálás a névből",
    shortDesc: "Rövid leírás (magyar)", shortDescEn: "Rövid leírás (angol)", longDesc: "Részletes leírás (magyar)", longDescEn: "Részletes leírás (angol)",
    priceHelp: "Bruttó ár forintban, egész szám.", unit: "Egység (magyar)", unitEn: "Egység (angol)", unitHelp: "Pl.: 230 g, 60 ml, db",
    stockHelp: "0 = elfogyott, nem tehető kosárba.", featuredHelp: "A kiemelt termékek a főoldalon is megjelennek.", tags: "Címkék", tagsHelp: "Vesszővel elválasztva. A keresőben is találatot adnak.",
    subcategory: "Alkategória", mainImage: "Fő kép", gallery: "További képek (galéria)", alt: "Alt szöveg", altHelp: "Röviden írd le, mi látható a képen (akadálymentesség, SEO).",
    pickImage: "Kép kiválasztása", removeImage: "Eltávolítás", addImage: "Kép hozzáadása", saveDraft: "Mentés piszkozatként", savePublish: "Mentés és publikálás",
    statusHelp: "Csak a publikált termék látható a vásárlóknak.",
    // categories
    catKey: "Belső azonosító", catKeyHelp: "Egyedi, angol technikai név (pl. Candles). Ez köti össze a termékeket a kategóriával.", catNameHu: "Megnevezés (magyar)", catNameEn: "Megnevezés (angol)",
    catDesc: "Rövid leírás (magyar)", catDescEn: "Rövid leírás (angol)", cover: "Borítókép", order: "Sorrend", active: "Aktív", inactive: "Inaktív",
    up: "Fel", down: "Le", deleteCat: "Törlés", deleteCatConfirm: "Biztosan törlöd ezt a kategóriát?", catInUse: "Ez a kategória {n} termékhez tartozik, ezért nem törölhető. Először sorold át a termékeket.",
    catExists: "Ilyen belső azonosító már létezik.", productsCount: "{n} termék",
    // media
    upload: "Kép feltöltése", dropHere: "Húzd ide a képet, vagy kattints a kiválasztáshoz", formats: "JPG, PNG, WebP, GIF · max. {n} MB", uploading: "Feltöltés…",
    badType: "Nem támogatott formátum. JPG, PNG, WebP vagy GIF lehet.", tooLarge: "A fájl túl nagy (max. {n} MB).", uploaded: "Kép feltöltve.",
    deleteMedia: "Kép törlése", deleteMediaConfirm: "Biztosan törlöd ezt a képet a médiatárból?", mediaInUse: "A kép {n} terméknél/kategóriánál használatban van, nem törölhető.",
    select: "Kiválaszt", library: "Médiatár", noMedia: "Még nincs feltöltött kép.", storageNote: "Tárolás: {d}. Élesben S3/R2 kompatibilis tárhely kötelező.",
    // orders
    orderId: "Rendelés", date: "Dátum", customer: "Vevő", total: "Összeg", payment: "Fizetés", fulfillment: "Teljesítés", details: "Részletek",
    fs_NEW: "Új", fs_AWAITING_PAYMENT: "Fizetésre vár", fs_PAID: "Fizetve", fs_PACKING: "Csomagolás alatt", fs_SHIPPED: "Feladva", fs_COMPLETED: "Teljesítve", fs_CANCELLED: "Törölve",
    ps_UNPAID: "Fizetésre vár", ps_PAID: "Fizetve", ps_FAILED: "Sikertelen", ps_RESERVED: "Kapu nem elérhető",
    changeStatus: "Státusz módosítása", tracking: "Csomagkövetés", carrier: "Szállító", trackingNo: "Nyomkövetési szám", trackingUrl: "Követési link", eta: "Várható kézbesítés",
    adminNote: "Belső megjegyzés", shipping: "Szállítás", items: "Tételek", address: "Szállítási cím", noDelete: "A rendelések nem törölhetők, csak Törölve státuszba állíthatók.",
    cancelConfirm: "Biztosan Törölve állapotba állítod? A készlet visszakerül, a vevő e-mailt kap.", invoice: "Számla", invoiceStatus: "Számla státusz", invoiceNo: "Számlaszám", invoiceUrl: "Számla link",
    inv_NONE: "Nincs", inv_NOT_CONFIGURED: "Számlázó nincs beállítva", inv_PENDING_PROVIDER: "Számlázónál folyamatban", inv_ISSUED: "Kiállítva", inv_ERROR: "Hiba", inv_MANUAL: "Kézzel rögzítve",
    history: "Előzmények", emailsForOrder: "Kiküldött e-mailek", noOrders: "Nincs rendelés.",
    // emails
    event: "Esemény", recipient: "Címzett", subject: "Tárgy", sentAt: "Időpont", resend: "Újraküldés", resendConfirm: "Biztosan újraküldöd ezt az e-mailt a címzettnek?",
    paymentReview: "A fizetés kézi ellenőrzést igényel: törlés után vagy több tranzakcióból érkezett sikeres fizetés. Ellenőrizd a SimplePay-fiókot és az esetleges visszatérítést.",
    es_QUEUED: "Küldésre vár", es_SENDING: "Küldés folyamatban", es_SENT: "Elküldve", es_FAILED: "Sikertelen", es_SKIPPED: "Kihagyva (nincs szolgáltató)", providerNote: "E-mail szolgáltató: {p}. „none” esetén a rendszer naplóz, de nem küld.",
    // newsletter
    subscribers: "Feliratkozók", consentedAt: "Hozzájárulás", source: "Forrás", removeSub: "Eltávolítás", removeSubConfirm: "Eltávolítod ezt a feliratkozót?", noSubs: "Nincs feliratkozó.",
    // dashboard
    dash_products: "Aktív termék", dash_orders: "Kezelendő rendelés", dash_low: "Alacsony készlet", dash_subs: "Hírlevél-feliratkozó", env: "Környezet", sandbox: "SimplePay: teszt (sandbox)", live: "SimplePay: éles",
    help: "Használati útmutató", helpText: "Termék felvitele: Termékek → Új termék → töltsd ki az alapadatokat, árat, készletet, válassz képet a Médiatárból vagy tölts fel újat → Mentés és publikálás. Kategória: Kategóriák → Új kategória. Rendelés: Rendelések → Részletek → Státusz módosítása. Részletes leírás a README-ben.",
  },
  en: {
    dashboard: "Overview", products: "Products", categories: "Categories", orders: "Orders", media: "Media library", newsletter: "Newsletter", emails: "Email log",
    search: "Search…", all: "All", add: "New product", addCat: "New category", edit: "Edit", save: "Save", cancel: "Cancel", close: "Close",
    saved: "Saved successfully.", failed: "Something went wrong. Please check the data.", confirm: "Confirm", yes: "Yes", no: "No",
    status: "Status", published: "Published", draft: "Draft", hidden: "Hidden", archived: "Archived", archive: "Archive",
    archiveConfirm: "Archive this product? Customers won't see it anymore; past orders keep their data.",
    bulk: "Bulk action", selected: "{n} selected", publish: "Publish", hide: "Hide", setCategory: "Change category", apply: "Apply",
    name: "Name", price: "Price", stock: "Stock", category: "Category", featured: "Featured", actions: "Actions", sort: "Sort",
    sortName: "Name", sortPrice: "Price", sortStock: "Stock", sortNewest: "Newest", showArchived: "Show archived",
    stockIn: "In stock", stockLow: "Low", stockOut: "Sold out",
    basics: "Basics", sales: "Sales", content: "Content", images: "Images", preview: "Preview",
    nameHu: "Name (Hungarian)", nameEn: "Name (English)", slug: "URL slug", slugHelp: "Lowercase letters, numbers and hyphens only.", slugGen: "Generate from name",
    shortDesc: "Short description (HU)", shortDescEn: "Short description (EN)", longDesc: "Long description (HU)", longDescEn: "Long description (EN)",
    priceHelp: "Gross price in HUF, integer.", unit: "Unit (HU)", unitEn: "Unit (EN)", unitHelp: "E.g. 230 g, 60 ml, pcs",
    stockHelp: "0 = sold out, cannot be added to cart.", featuredHelp: "Featured products also appear on the home page.", tags: "Tags", tagsHelp: "Comma separated. Also searchable.",
    subcategory: "Subcategory", mainImage: "Main image", gallery: "Gallery images", alt: "Alt text", altHelp: "Briefly describe the image (accessibility, SEO).",
    pickImage: "Pick image", removeImage: "Remove", addImage: "Add image", saveDraft: "Save as draft", savePublish: "Save & publish",
    statusHelp: "Only published products are visible to customers.",
    catKey: "Internal key", catKeyHelp: "Unique technical name (e.g. Candles). Links products to the category.", catNameHu: "Label (Hungarian)", catNameEn: "Label (English)",
    catDesc: "Short description (HU)", catDescEn: "Short description (EN)", cover: "Cover image", order: "Order", active: "Active", inactive: "Inactive",
    up: "Up", down: "Down", deleteCat: "Delete", deleteCatConfirm: "Delete this category?", catInUse: "This category has {n} products and cannot be deleted. Move the products first.",
    catExists: "This internal key already exists.", productsCount: "{n} products",
    upload: "Upload image", dropHere: "Drop an image here or click to choose", formats: "JPG, PNG, WebP, GIF · max {n} MB", uploading: "Uploading…",
    badType: "Unsupported format. Use JPG, PNG, WebP or GIF.", tooLarge: "File too large (max {n} MB).", uploaded: "Image uploaded.",
    deleteMedia: "Delete image", deleteMediaConfirm: "Delete this image from the library?", mediaInUse: "Image is used by {n} products/categories and cannot be deleted.",
    select: "Select", library: "Library", noMedia: "No images uploaded yet.", storageNote: "Storage: {d}. S3/R2-compatible storage is required in production.",
    orderId: "Order", date: "Date", customer: "Customer", total: "Total", payment: "Payment", fulfillment: "Fulfilment", details: "Details",
    fs_NEW: "New", fs_AWAITING_PAYMENT: "Awaiting payment", fs_PAID: "Paid", fs_PACKING: "Packing", fs_SHIPPED: "Shipped", fs_COMPLETED: "Completed", fs_CANCELLED: "Cancelled",
    ps_UNPAID: "Awaiting payment", ps_PAID: "Paid", ps_FAILED: "Failed", ps_RESERVED: "Gateway unavailable",
    changeStatus: "Change status", tracking: "Tracking", carrier: "Carrier", trackingNo: "Tracking number", trackingUrl: "Tracking link", eta: "Expected delivery",
    adminNote: "Internal note", shipping: "Shipping", items: "Items", address: "Shipping address", noDelete: "Orders cannot be deleted, only set to Cancelled.",
    cancelConfirm: "Set to Cancelled? Stock is restored and the customer is emailed.", invoice: "Invoice", invoiceStatus: "Invoice status", invoiceNo: "Invoice number", invoiceUrl: "Invoice link",
    inv_NONE: "None", inv_NOT_CONFIGURED: "Provider not configured", inv_PENDING_PROVIDER: "Pending at provider", inv_ISSUED: "Issued", inv_ERROR: "Error", inv_MANUAL: "Recorded manually",
    history: "History", emailsForOrder: "Sent emails", noOrders: "No orders.",
    event: "Event", recipient: "Recipient", subject: "Subject", sentAt: "Time", resend: "Resend", resendConfirm: "Resend this email to the recipient?",
    paymentReview: "Payment needs review: a successful payment arrived after cancellation or from multiple transactions. Check SimplePay and any required refund.",
    es_QUEUED: "Queued", es_SENDING: "Sending", es_SENT: "Sent", es_FAILED: "Failed", es_SKIPPED: "Skipped (no provider)", providerNote: "Email provider: {p}. With “none” the system logs but does not send.",
    subscribers: "Subscribers", consentedAt: "Consent", source: "Source", removeSub: "Remove", removeSubConfirm: "Remove this subscriber?", noSubs: "No subscribers.",
    dash_products: "Active products", dash_orders: "Orders to handle", dash_low: "Low stock", dash_subs: "Newsletter subscribers", env: "Environment", sandbox: "SimplePay: test (sandbox)", live: "SimplePay: live",
    help: "How to use", helpText: "Add a product: Products → New product → fill basics, price, stock, pick an image from the Media library or upload → Save & publish. Category: Categories → New category. Order: Orders → Details → Change status. Full guide in README.",
  },
};

export const useA = () => {
  const { lang } = useLang();
  return (k, vars) => {
    let s = A[lang]?.[k] ?? A.hu[k] ?? k;
    if (vars) Object.entries(vars).forEach(([kk, v]) => { s = s.replace(`{${kk}}`, v); });
    return s;
  };
};

export const errText = (err, a) => {
  const d = err?.response?.data?.detail;
  if (typeof d !== "string") return a("failed");
  if (d.startsWith("category_in_use:")) return a("catInUse", { n: d.split(":")[1] });
  if (d.startsWith("media_in_use:")) return a("mediaInUse", { n: d.split(":")[1] });
  if (d.startsWith("file_too_large:")) return a("tooLarge", { n: d.split(":")[1] });
  if (d === "unsupported_type") return a("badType");
  if (d === "category_exists") return a("catExists");
  if (d === "slug_exists") return a("slug") + ": " + a("catExists").toLowerCase();
  return d.length < 120 ? d : a("failed");
};

export const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString("hu-HU", { dateStyle: "short", timeStyle: "short" }) : "-");
export const slugify = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
