// Only display known messages, never raw server responses or database details.
const fields = {
  name: ['Név (magyar)', 'Name (Hungarian)'], name_en: ['Név (angol)', 'Name (English)'],
  slug: ['URL-azonosító', 'URL slug'], category: ['Kategória', 'Category'],
  price: ['Ár', 'Price'], stock: ['Készlet', 'Stock'], subcategory: ['Alkategória', 'Subcategory'],
  description: ['Rövid leírás (magyar)', 'Short description (Hungarian)'], description_en: ['Rövid leírás (angol)', 'Short description (English)'],
  long_description: ['Hosszú leírás (magyar)', 'Long description (Hungarian)'], long_description_en: ['Hosszú leírás (angol)', 'Long description (English)'],
  usage_instructions: ['Használati útmutató (magyar)', 'Usage instructions (Hungarian)'], usage_instructions_en: ['Használati útmutató (angol)', 'Usage instructions (English)'],
  unit: ['Egység', 'Unit'], unit_en: ['Egység (angol)', 'Unit (English)'],
  image: ['Főkép', 'Main image'], image_alt: ['Képleírás', 'Image description'], images: ['Galéria', 'Gallery'],
  tags: ['Címkék', 'Tags'], status: ['Állapot', 'Status'], featured: ['Kiemelt', 'Featured'],
  attributes: ['Termékadatok', 'Product attributes'], attribute_key: ['Termékadat-azonosító', 'Attribute key'],
  key: ['Termékadat-azonosító', 'Attribute key'], enabled: ['Termékadat jelölőnégyzete', 'Attribute checkbox'],
  label: ['Termékadat neve', 'Attribute label'], label_en: ['Termékadat angol neve', 'English attribute label'],
  value: ['Termékadat értéke', 'Attribute value'], value_en: ['Termékadat angol értéke', 'English attribute value'],
};
const messages = {
  slug_or_identifier_exists: ['Ez az URL-azonosító már foglalt. Adj meg egy másikat, vagy szerkeszd a meglévő terméket.', 'This URL slug already exists. Choose another slug or edit the existing product.'],
  invalid_url: ['A kép címe hibás. Válassz képet a médiatárból, vagy adj meg teljes https:// címet.', 'Invalid image URL. Select an image from the library or enter a full https:// URL.'],
  related_record_required_or_in_use: ['Egy kapcsolódó adat hiányzik vagy használatban van. Ellenőrizd a kategóriát.', 'A related record is missing or in use. Check the category.'],
  database_unavailable: ['Az adatbázis jelenleg nem érhető el. A beírt adatok megmaradtak; próbáld újra később.', 'The database is unavailable. Your input has been kept; try again later.'],
  concurrent_update_retry: ['Egy másik módosítás miatt nem sikerült menteni. Próbáld újra.', 'Another update prevented saving. Please retry.'],
  origin_not_allowed: ['A szerver nem engedi erről a webcímről a mentést. Ellenőrizni kell a webhely címének beállítását.', 'The server does not allow saving from this website address. Check the site URL configuration.'],
};
export function productSaveError(err, lang = 'hu') {
  const en = lang === 'en'; const i = en ? 1 : 0;
  const status = err?.response?.status;
  const code = err?.response?.data?.detail;
  if (status === 401) return en ? 'Admin access is invalid. Copy your text before signing in again.' : 'Az adminbelépés érvénytelen. Másold ki a szövegeket, majd jelentkezz be újra.';
  if (status === 429) return en ? 'Too many attempts. Wait 10 minutes before retrying.' : 'Túl sok próbálkozás. Várj 10 percet az újrapróbálkozással.';
  if (status === 413) return en ? 'The submitted data is too large. Shorten the text and use the media library for images.' : 'Túl nagy a beküldött adat. Rövidítsd a szöveget, a képekhez használd a médiatárat.';
  if (status === 404) return en ? 'The product or category no longer exists. Check the product list and category.' : 'A termék vagy kategória már nem található. Ellenőrizd a terméklistát és a kategóriát.';
  if (Object.prototype.hasOwnProperty.call(messages, code)) return messages[code][i];
  const match = typeof code === 'string' && /^(required|invalid)_(\w+)$/.exec(code);
  if (match && Object.prototype.hasOwnProperty.call(fields, match[2])) {
    return `${fields[match[2]][i]}: ${match[1] === 'required' ? (en ? 'this field is required.' : 'ezt a mezőt kötelező kitölteni.') : (en ? 'invalid value or text too long. Check this field.' : 'hibás érték vagy túl hosszú szöveg. Ellenőrizd ezt a mezőt.')} (${code})`;
  }
  if (!err?.response) return en ? 'The server did not respond. Check your connection. Check the product list before retrying to avoid duplicates.' : 'Nem érkezett válasz a szervertől. Ellenőrizd az internetkapcsolatot. Újrapróbálkozás előtt nézd meg, létrejött-e a termék.';
  return en ? `Saving failed (HTTP ${Number(status) || 'unknown'}). Your input has been kept. Send a screenshot of this message.` : `A mentés nem sikerült (HTTP ${Number(status) || 'ismeretlen'}). A beírt adatok megmaradtak. Küldj képet erről az üzenetről.`;
}
export function validateProduct(body) {
  for (const key of ['name', 'category', 'slug']) if (!String(body[key] || '').trim()) return `required_${key}`;
  for (const [key, max] of [['price', 1000000000], ['stock', 10000000]]) {
    if (body[key] === '' || !Number.isInteger(Number(body[key])) || Number(body[key]) < 0 || Number(body[key]) > max) return `invalid_${key}`;
  }
  return null;
}
