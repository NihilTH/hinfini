# H'INFINI Candles — webshop és tudástár

Kézműves gyertyakészítő webshop (React + FastAPI + MongoDB), kétnyelvű (HU/EN) felülettel, vendég-pénztárral, SimplePay bankkártyás fizetéssel, admin felülettel, médiatárral és tranzakciós e-mail rendszerrel.

> **Állapot:** a SimplePay integráció **teszt (sandbox)** módban fut. Éles fizetéshez saját kereskedői azonosító, éles kulcs és publikus IPN URL szükséges (lásd lent).

---

## Tartalom
1. [Architektúra](#architektúra)
2. [Gyors indítás fejlesztéshez](#gyors-indítás-fejlesztéshez)
3. [Környezeti változók](#környezeti-változók)
4. [Telepítés saját szerverre / domainre](#telepítés-saját-szerverre--domainre)
5. [Adatbázis és mentés](#adatbázis-és-mentés)
6. [Külső szolgáltatások beállítása](#külső-szolgáltatások-beállítása)
7. [Admin használati útmutató](#admin-használati-útmutató)
8. [Mi működik, mi igényel még külső beállítást](#mi-működik-mi-igényel-még-külső-beállítást)

---

## Architektúra

```
backend/
  server.py        FastAPI app – publikus és admin API (/api/...)
  config.py        minden beállítás környezeti változóból
  storage.py       képtároló réteg: LocalStorage (dev) | S3Storage (R2/S3)
  emailer.py       tranzakciós e-mail (Resend/SendGrid REST), sablonok, napló, idempotencia
  invoicing.py     NAV-kompatibilis számlázó előkészítés (státusz-követés, hook)
  seed_data.py     kezdő termékek, kategóriák, útmutatók
frontend/src/
  context/         LangContext (HU/EN), CartContext, CatalogContext
  components/      Layout, ProductTile, SmartImage, Seo, NewsletterForm
  pages/           Home, Shop, ProductDetail, Cart, Checkout, OrderSuccess, Learn, Legal, Admin…
  admin/           AdminProducts, ProductEditor, AdminCategories, AdminOrders, Media, AdminMisc
```

**Adatbázis-kollekciók (MongoDB):** `products`, `categories`, `guides`, `orders`, `media`, `newsletter`, `email_logs`.

**Rendelés állapotok**
- `payment_status`: `UNPAID` → `PAID` / `FAILED` (kizárólag SimplePay **IPN** alapján), `RESERVED` (fizetési kapu nem volt elérhető)
- `fulfillment_status`: `NEW`, `AWAITING_PAYMENT`, `PAID`, `PACKING`, `SHIPPED`, `COMPLETED`, `CANCELLED`
- Rendelés **nem törölhető**, csak `CANCELLED` állapotba állítható (a készlet ekkor visszakerül).

---

## Gyors indítás fejlesztéshez

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env         # töltsd ki (fejlesztéshez: APP_ENV=development, STORAGE_DRIVER=local, EMAIL_PROVIDER=none)
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend
cd frontend
yarn install
echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env
yarn start
```

Az első indításkor a backend feltölti a kezdő termékeket, kategóriákat és útmutatókat (csak üres adatbázis esetén).

---

## Környezeti változók

Minden titok **csak** környezeti változóban él. Teljes lista példákkal: [`backend/.env.example`](backend/.env.example).

| Változó | Kötelező | Leírás |
|---|---|---|
| `APP_ENV` | igen | `production` esetén a `local` képtár tiltott (indításkor hibát dob) |
| `MONGO_URL`, `DB_NAME` | igen | MongoDB kapcsolat (Atlas vagy saját szerver) |
| `CORS_ORIGINS` | igen | engedélyezett frontend originek, vesszővel |
| `PUBLIC_SITE_URL` | igen | a publikus webcím (e-mail linkek, SimplePay visszatérés) |
| `ADMIN_TOKEN` | igen | admin hozzáférési kulcs – **soha ne kerüljön frontend kódba vagy repo-ba** |
| `SIMPLEPAY_MERCHANT_ID`, `SIMPLEPAY_SECRET_KEY`, `SIMPLEPAY_BASE_URL` | igen | SimplePay v2 |
| `STORAGE_DRIVER` + `S3_*` | igen (éles) | R2/S3 képtár |
| `EMAIL_PROVIDER` + `RESEND_API_KEY` / `SENDGRID_API_KEY`, `EMAIL_FROM*`, `ORDER_NOTIFY_EMAIL`, `SUPPORT_EMAIL` | igen (éles) | tranzakciós e-mail |
| `INVOICE_PROVIDER`, `INVOICE_TRIGGER`, `INVOICE_API_KEY` | opcionális | számlázó előkészítés |
| `FREE_SHIPPING_FROM`, `SHIPPING_FEE_HOME`, `SHIPPING_FEE_PICKUP`, `LOW_STOCK_THRESHOLD` | opcionális | üzleti paraméterek |

Frontend: egyetlen változó, `REACT_APP_BACKEND_URL` (a backend publikus címe, `/api` nélkül).

---

## Telepítés saját szerverre / domainre

### 1. Kód
Töltsd fel a repót GitHubra (a chat „Save to GitHub” funkciójával vagy `git push`-sal). A `.env` fájlok **nem** kerülnek a repóba.

### 2. Backend (pl. Ubuntu VPS, Docker vagy Railway/Render)
```bash
git clone <repo> && cd backend
pip install -r requirements.txt
# .env kitöltése az .env.example alapján, APP_ENV=production
uvicorn server:app --host 0.0.0.0 --port 8001 --workers 2
```
Javasolt: `systemd` service vagy Docker, elé **Nginx/Caddy** reverse proxy HTTPS-sel (Let's Encrypt).

Nginx példa:
```nginx
server {
  server_name api.sajatdomain.hu;
  location / { proxy_pass http://127.0.0.1:8001; proxy_set_header Host $host; proxy_set_header X-Forwarded-For $remote_addr; }
}
```

### 3. Frontend (statikus build)
```bash
cd frontend
echo "REACT_APP_BACKEND_URL=https://api.sajatdomain.hu" > .env.production
yarn build            # -> build/ mappa
```
A `build/` mappa bármely statikus tárhelyre kerülhet (Nginx, Cloudflare Pages, Netlify, Vercel). SPA-hoz minden útvonalat az `index.html`-re kell irányítani (Nginx: `try_files $uri /index.html;`).

### 4. Domain és DNS
- `www.sajatdomain.hu` → frontend
- `api.sajatdomain.hu` → backend
- `media.sajatdomain.hu` → R2/S3 bucket publikus domainje (`S3_PUBLIC_BASE_URL`)
- `CORS_ORIGINS=https://www.sajatdomain.hu`, `PUBLIC_SITE_URL=https://www.sajatdomain.hu`

### 5. SimplePay élesítés
1. Kereskedői szerződés, éles `MERCHANT_ID` és `SECRET_KEY` az OTP Mobiltól.
2. `SIMPLEPAY_BASE_URL=https://secure.simplepay.hu/payment/v2`
3. A SimplePay admin felületén az **IPN URL**: `https://api.sajatdomain.hu/api/payments/ipn` (publikus HTTPS kötelező).
4. Tesztvásárlás; a rendelés csak IPN után válik `PAID` állapotúvá.

---

## Adatbázis és mentés

- **Ajánlott:** MongoDB Atlas (managed, automatikus napi mentés, point-in-time restore fizetős csomagban).
- **Saját szerver:** `mongodump` időzítve (cron), pl. naponta:
  ```bash
  0 3 * * * mongodump --uri="$MONGO_URL" --db=hinfini --archive=/backups/hinfini-$(date +\%F).gz --gzip
  ```
  A mentéseket **külön tárhelyre** (pl. R2 bucket, `rclone`) is másold, és rendszeresen próbáld a visszaállítást (`mongorestore --archive=... --gzip`).
- Képek: az R2/S3 bucketre kapcsolj be verziózást vagy időzített replikációt.
- Titkok (`.env`) mentése jelszókezelőben, nem a repóban.

---

## Külső szolgáltatások beállítása

### Cloudflare R2 (vagy S3-kompatibilis képtár)
1. Bucket létrehozása (`hinfini-media`), publikus hozzáférés vagy custom domain (`media.sajatdomain.hu`).
2. API token (Object Read & Write) → `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.
3. `S3_ENDPOINT_URL=https://<ACCOUNT_ID>.r2.cloudflarestorage.com`, `S3_REGION=auto`, `STORAGE_DRIVER=s3`.

### Resend / SendGrid (tranzakciós e-mail)
1. Domain hitelesítés (SPF, DKIM) a szolgáltatónál.
2. API kulcs → `RESEND_API_KEY` vagy `SENDGRID_API_KEY`, `EMAIL_PROVIDER=resend|sendgrid`.
3. `EMAIL_FROM` a hitelesített domainen, `ORDER_NOTIFY_EMAIL` a belső rendelési értesítő cím.
4. Minden küldés az **E-mail napló** admin fülön látható (státusz, hiba, újraküldés). `EMAIL_PROVIDER=none` esetén a rendszer naplóz, de nem küld (`SKIPPED`).

Kiküldött e-mailek: rendelés-visszaigazolás, sikeres fizetés (csak IPN után), sikertelen fizetés, csomag feladva, rendelés törölve; adminnak: új rendelés, sikeres/sikertelen fizetés, törlés, alacsony készlet. Idempotens: egy eseményről egy címzett egyszer kap levelet (kivéve kézi újraküldés).

### Számlázó (Számlázz.hu / Billingo)
A számlázás külön folyamat a visszaigazolástól. `INVOICE_TRIGGER=paid|fulfilled` szabályozza, mikor induljon. A szolgáltató-specifikus API-hívás a `backend/invoicing.py` `issue_invoice()` függvényében implementálandó; addig az admin kézzel rögzítheti a számlaszámot és linket.

---

## Admin használati útmutató

Belépés: `https://www.sajatdomain.hu/admin` → add meg az `ADMIN_TOKEN` értékét. A kulcs csak a böngésző munkamenetében tárolódik.

### Termék felvitele
1. **Termékek** fül → **Új termék**.
2. *Alapadatok:* magyar és angol név, URL azonosító (a „Generálás a névből” gomb kitölti), kategória, rövid leírás, állapot.
3. *Értékesítés:* ár (Ft, egész szám), egység (pl. „230 g”), készlet (0 = elfogyott, nem tehető kosárba), kiemelt kapcsoló.
4. *Tartalom:* részletes leírás, címkék (vesszővel).
5. *Képek:* **Kép kiválasztása** → Médiatár (feltöltés vagy korábbi kép), alt szöveg megadása; galéria képek hozzáadása.
6. Jobb oldalon az **Előnézet** mutatja a terméket, ahogy a boltban megjelenik.
7. **Mentés és publikálás** (látható a vásárlóknak) vagy **Mentés piszkozatként** (rejtett).

Több termék kijelölésével a lista fölött tömeges művelet érhető el: publikálás, elrejtés, archiválás, kategória módosítása. A termék törlése helyett **archiválás** van (a régi rendelések adatai megmaradnak).

### Kép feltöltése
**Médiatár** fül (vagy a termékszerkesztő „Kép kiválasztása” gombja) → húzd be a képet vagy kattints → előnézet → alt szöveg → **Kép feltöltése**. Támogatott: JPG, PNG, WebP, GIF, max. 5 MB. Használatban lévő kép nem törölhető.

### Kategória létrehozása
**Kategóriák** fül → **Új kategória** → belső azonosító (egyedi, pl. `Candles`), magyar és angol megnevezés, rövid leírások, borítókép, aktív/inaktív. A sorrend a fel/le nyilakkal módosítható. Olyan kategória, amelyhez termék tartozik, nem törölhető.

### Rendelés állapotának módosítása
**Rendelések** fül → keresés (rendelésszám, név, e-mail) → **Részletek**. A jobb oldalon a *Státusz módosítása* listából válassz (Új, Fizetésre vár, Fizetve, Csomagolás alatt, Feladva, Teljesítve, Törölve). **Feladva** állapotnál megadhatod a szállítót, nyomkövetési számot és linket — a vevő automatikusan e-mailt kap. **Törölve** megerősítést kér, visszaállítja a készletet és értesíti a vevőt. A kiküldött e-mailek a rendelés részleteinél is látszanak, újraküldhetők.

### Hírlevél
A **Hírlevél** fülön a feliratkozók listája (hozzájárulás időpontjával, forrással). Az e-mail küldés hírlevélhez nincs bekötve, a lista exportálható/kezelhető.

---

## Mi működik, mi igényel még külső beállítást

**Készen működik**
- Kétnyelvű (HU/EN) bolt, kereső, rendezés, szűrés, termékoldal készletállapottal és kapcsolódó termékekkel
- Kosár (készletkorlát, elfogyott termék nem tehető be), vendég pénztár, ÁSZF/adatkezelés elfogadás, hírlevél opt-in
- SimplePay **sandbox** fizetésindítás, aláírt visszatérés ellenőrzése, IPN feldolgozás, státusz csak IPN alapján
- Admin: termékek (piszkozat/publikált/elrejtett/archivált, tömeges műveletek, előnézet), kategóriák (sorrend, aktív), médiatár (feltöltés, alt, törlésvédelem), rendelések (státusz, csomagkövetés, számla státusz, e-mail napló, újraküldés), hírlevél lista
- E-mail rendszer sablonokkal, naplózással és idempotenciával (szolgáltató nélkül `SKIPPED` státusszal naplóz)
- Jogi sablon oldalak (szerkeszthető, placeholderekkel), SEO title/description, fókuszállapotok, aria címkék, data-testid

**Külső beállítást igényel**
- SimplePay éles kereskedői adatok + publikus IPN URL
- Cloudflare R2 / S3 kulcsok (`STORAGE_DRIVER=s3`) — élesben kötelező
- Resend vagy SendGrid API kulcs + hitelesített feladó domain
- NAV-kompatibilis számlázó API (Számlázz.hu / Billingo) bekötése `invoicing.py`-ban
- Csomagpontos szállítás (jelenleg „fejlesztés alatt”, nem választható)
- Jogi szövegek véglegesítése (ÁSZF, adatkezelés, elállás) és cégadatok kitöltése
