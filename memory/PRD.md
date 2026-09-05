# H'INFINI Candles — PRD (frissítve 2026. június)

## Eredeti feladat
Kézműves gyertyakészítő webshop + tudástár, "H'INFINI Candles" márka, sötét antracit–arany arculat, Cormorant Garamond + Manrope. Kétnyelvű (HU alap, EN váltó), vendég-pénztár (nincs vásárlói auth), SimplePay sandbox (HUF), Felfedezés oldal, admin felület (termék/kategória/média/rendelés), Emergent-független futtatás saját domainen.

## Felhasználói döntések
- Képtár: saját S3/R2-kompatibilis (env-ből), local csak dev-ben, Emergent Object Storage NEM
- Hírlevél: valódi feliratkozás hozzájárulással, admin lista
- Termékek és kategóriák HU/EN mezőkkel
- Feltöltött logó a fejlécben
- Termék törlés helyett archiválás; rendelés nem törölhető
- Tranzakciós e-mail: Resend/SendGrid REST env-ből, naplózás, idempotencia; számlázó előkészítés (Számlázz.hu/Billingo hook)

## Architektúra
- backend/: server.py (API), config.py, storage.py (Local|S3), emailer.py, invoicing.py, seed_data.py, .env.example
- frontend/src/: context (Lang, Cart, Catalog), components (Layout, ProductTile, SmartImage, Seo, NewsletterForm), pages (Home, Shop, ProductDetail, Cart, Checkout, OrderSuccess, Learn, GuideDetail, Discover, Legal, Admin), admin/ (AdminProducts, ProductEditor, AdminCategories, AdminOrders, Media, AdminMisc, adminApi, ui)
- Mongo kollekciók: products, categories, guides, orders, media, newsletter, email_logs

## Megvalósítva (2026-06, ez a kör) — tesztelve: iteration_2.json 100%/100%
- Teljes HU/EN szótár, HU/EN szöveges nyelvváltó, kategória + termék HU/EN mezők
- Főoldal márkabemutató szekció; "Kosárba" gomb; kereső ikon → /shop fókusz; teljes mobil menü
- Bolt: rendezés (ajánlott/ár↑/ár↓/legújabb), mobil szűrő, találatszám; termékoldal: készletállapot, szállítási infó, galéria, kapcsolódó termékek, vissza a kategóriához
- SmartImage (lazy, alt, fallback); Seo komponens (title/description oldalanként)
- Kosár: készletkorlát, elfogyott nem tehető be; pénztár: szállítási mód (házhoz / csomagpont "fejlesztés alatt"), ÁSZF+adatkezelés kötelező, hírlevél opt-in, részletes összesítő, kosár csak sikeres rendelés után ürül
- Rendelés oldal: "Sikeres fizetés" csak IPN alapján (payment_status PAID), egyébként "Rendelés rögzítve / feldolgozás alatt"; aláírt SimplePay visszatérés ellenőrzése (/api/payments/return)
- SimplePay start javítva (timeout formátum, egyedi orderRef), IPN → PAID + e-mailek + számla hook
- Jogi sablon oldalak: /szallitas /elallas /aszf /adatkezeles /kapcsolat (HU/EN, placeholderek), láblécben
- Hírlevél: POST /api/newsletter/subscribe (consent kötelező), admin lista/törlés
- Admin: token csak env-ben, nincs demo token a UI-ban, sessionStorage, 8 hibás próbálkozás → 429; statisztika; termékek (keresés/szűrés/rendezés, csoportosított szerkesztő, előnézet, piszkozat/publikált/elrejtett/archivált, tömeges műveletek), kategóriák (HU/EN, leírás, borító, sorrend fel/le, aktív, törlésvédelem), médiatár (drag&drop, formátum/méret ellenőrzés, alt, törlésvédelem, képválasztó), rendelések (lista, részletek, státusz NEW→…→CANCELLED, csomagkövetés, számla státusz, e-mail napló + újraküldés megerősítéssel), hírlevél, e-mail napló
- Tranzakciós e-mail rendszer: 10 sablon (vevő: rendelés/fizetés ok/fizetés hiba/feladva/törölve; admin: új rendelés/fizetve/hiba/törlés/alacsony készlet), idempotens, naplózott
- Atomikus készletcsökkentés rendelésnél
- README: telepítés, env, adatbázis/mentés, R2/Resend/SimplePay élesítés, admin útmutató

## Külső beállítást igényel (nem kód)
- SimplePay éles kulcsok + publikus IPN URL
- R2/S3 kulcsok (STORAGE_DRIVER=s3), Resend/SendGrid kulcs + domain hitelesítés
- Számlázó API implementáció invoicing.issue_invoice()-ban
- Csomagpontos szállítás bekötése
- Jogi szövegek véglegesítése

## Backlog (P1/P2)
- P1: rendelés-lekérdezés védelme (order_id mellett aláírt token) — teszt-review javaslat
- P1: server.py modulokra bontása (admin/payments/seed)
- P2: hírlevél küldő integráció, kategóriák drag&drop, Számlázz.hu/Billingo konkrét API
