# H’INFINI — PHP + MySQL telepítés cPanelre

A szerveroldal PHP 8.3+, az adatbázis MySQL 8.0+ vagy MariaDB 10.6+.
A meglévő React felület statikus buildként fut: a tárhelyen nem kell Python,
MongoDB, Node.js vagy Composer. Node.js és Yarn csak a csomag összeállításához kell.

## 1. Letölthető csomag

GitHub → Actions → **PHP MySQL checks and cPanel package** → sikeres futás →
Artifacts → **hinfini-cpanel-php-mysql**. A ZIP két fontos könyvtárat tartalmaz:

- `public_html`: a webhely nyilvános fájljai (a rejtett `.htaccess` is kell).
- `backend-php`: PHP kód, konfiguráció, SQL és képfeltöltések; a `public_html` mellé kerül.

Helyi összeállítás a repó gyökeréből:

```sh
cd frontend
corepack yarn install --frozen-lockfile
REACT_APP_BACKEND_URL= GENERATE_SOURCEMAP=false corepack yarn build
cd ..
node scripts/package-cpanel.mjs
```

A kész csomag a `release` mappában lesz. A PHP ág forráskódja önmagában nem
helyettesíti a lefordított felületet: ne a `frontend/src` mappát töltsd fel.

## 2. Tárhely és fájlok

cPanel → Select PHP Version: PHP 8.3 vagy újabb; kiterjesztések:
`pdo_mysql`, `curl`, `mbstring`, `fileinfo`. Apache 2.4 és `mod_rewrite` szükséges.
Állítsd a `upload_max_filesize` értékét legalább `5M`, a `post_max_size` értékét
legalább `6M` méretre. A domainen kapcsolj be HTTPS-t.

Példa elrendezés:

```text
/home/FELHASZNALO/backend-php/config.local.php
/home/FELHASZNALO/backend-php/http.php
/home/FELHASZNALO/public_html/index.html
/home/FELHASZNALO/public_html/.htaccess
/home/FELHASZNALO/public_html/api/index.php
```

A Fájlkezelő beállításaiban kapcsold be a rejtett fájlok megjelenítését.
Ha a domain dokumentumgyökere más mappa vagy mélyebben van, az
`api/index.php` egyetlen `require` sorát módosítsd a `backend-php/http.php`
abszolút útvonalára. A PHP mappa és az adatimportok ne legyenek nyilvánosak.
A csomag domain-gyökérre készült, nem `/webshop` almappára.

## 3. MySQL létrehozása

cPanel → MySQL Databases: hozz létre adatbázist és külön adatbázis-felhasználót,
rendeld hozzá a felhasználót az adatbázishoz. Vedd figyelembe a cPanel előtagot
(pl. `fiok_hinfini`). A telepítéshez táblalétrehozási jogosultság is kell.

phpMyAdminban válaszd ki az új adatbázist, majd Import:

1. `backend-php/database/schema.sql`
2. Új, üres bolt esetén `backend-php/database/seed.sql` (eredeti mintatermékek).

A sémát egyszer kell telepíteni. A seed SQL-t csak üres táblákon futtasd.
Meglévő éles adatok költöztetésénél hagyd ki a mintatermékeket, lásd lent.

Másold a `config.example.php` fájlt `config.local.php` néven, és töltsd ki:
`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `PUBLIC_SITE_URL`, `ADMIN_TOKEN`.
Az admin token legyen hosszú, véletlenszerű titok. Ha üres, az admin nem érhető el.
A konfiguráció fájljogosultsága lehetőleg `600`, a PHP futtató felhasználó számára
olvasható legyen. Az `uploads` mappa legyen írható ugyanennek a felhasználónak.

Terminállal a séma és a minták telepítése:

```sh
php backend-php/bin/console.php migrate
php backend-php/bin/console.php seed
```

## 4. Fizetés, e-mailek, képek

SimplePay: kereskedői azonosító és titkos kulcs szükséges. Alapérték a sandbox.
Az IPN cím `https://DOMAIN/api/payments/ipn`. A visszatérés csak tájékoztat,
fizetett állapotot kizárólag hiteles IPN állít be. Élesítés előtt a saját
kereskedői fiókkal teljes sandbox vásárlást és szolgáltatói jóváhagyást végezz.
A kód helyi tesztje nem jelent SimplePay-tanúsítást. Az éles végpont:
`https://secure.simplepay.hu/payment/v2`.

E-mail: `EMAIL_PROVIDER=resend` vagy `sendgrid`, API-kulcs, hitelesített
`EMAIL_FROM`, `ORDER_NOTIFY_EMAIL`, `SUPPORT_EMAIL` beállítása. cPanel → Cron Jobs:
percenként futtasd (a PHP elérési útját a tárhely szolgáltatója adja meg):

```sh
/usr/local/bin/php /home/FELHASZNALO/backend-php/bin/console.php mail:send
```

Az e-mailek adatbázisban várnak, a fizetési/rendelési tranzakció részeként kerülnek
sorba. Cron nélkül `QUEUED` állapotban maradnak. `none` módban `SKIPPED` lesz,
nem küld levelet. A sikertelen levelek az adminból újraküldhetők.
Ha egy munkafolyamat küldés közben megszakad, `SENDING` maradhat: ellenőrizd a
szolgáltató naplóját, és csak utána indíts kézi újraküldést a duplikálás elkerülésére.

Képek: `STORAGE_DRIVER=local` esetén a `backend-php/uploads` mappában maradnak,
és a PHP kizárólag ellenőrzött képformátumként szolgálja ki őket.
S3/R2 esetén `STORAGE_DRIVER=s3`, az `S3_*` beállítások és publikus képcím kell.
A path-style S3 API-t használjuk; R2-höz a régió `auto`.

## 5. Meglévő MongoDB adatok költöztetése

Először készíts mentést, állítsd le a régi bolt új rendeléseit/adminmódosításait,
és lehetőleg várd meg a függő SimplePay-tranzakciókat. A JSON exportok az éles
adatbázisból származnak; a GitHub repó nem tartalmazza azokat.
A MongoDB Database Tools `mongoexport` programjával exportáld az alábbi kollekciókat
JSON tömbként (`--jsonArray`): `categories`, `products`, `guides`, `orders`,
`media`, `newsletter`, `email_logs`. A fájlnevek a kollekciónevek legyenek `.json`
kiterjesztéssel. Normál JSON export kell, nem BSON/mongodump vagy Extended JSON számobjektumok.

Telepítsd a sémát egy üres MySQL adatbázisba, a seedet hagyd ki, majd:

```sh
php backend-php/bin/console.php import /home/FELHASZNALO/private-export
```

Az import egy tranzakció, és megtagadja a nem üres céladatbázist. A régi rendelési,
termék- és kémazonosítók megmaradnak. Az S3-képcímek változatlanok; helyi képeknél
másold át az eredeti `uploads` mappát is, az év/hónap struktúrával együtt.
Domainváltás esetén a régi abszolút képcímek átírása külön költöztetési feladat.
A régi rövid rendelésazonosítók megmaradnak, de a publikus API nem ad ki címet,
e-mailt vagy telefonszámot. Az új rendelésazonosítók 128 bites véletlen hivatkozások.

Import után hasonlítsd össze a termék- és rendelésszámot, készleteket, összegeket,
valamint a képmegjelenítést. Az exportfájlokat a sikeres ellenőrzés után távolítsd el
a tárhelyről. A leállás alatt beérkező IPN-eket és a régi rendszerben elindított,
eltérő visszatérési című fizetéseket külön ellenőrizd az átálláskor.

## 6. Ellenőrzés és korlátok

Nyisd meg a `/api/` és `/api/products` címeket, majd a boltot és az `/admin`
felületet. Ellenőrizd a termékszerkesztést, képfeltöltést, rendelést, készletet,
SimplePay sandbox visszatérést/IPN-t, a Cron után az e-mail naplót.

- Az automatikus Billingo/Számlázz.hu számlázás az eredetiben sem volt kész;
  itt is kézi számlarögzítés és látható konfigurációs állapot van.
- Csomagpont-integráció továbbra sincs, a szerver is elutasítja a csomagpontos rendelést.
- Törlés egyszer adja vissza a készletet; törölt rendelés nem nyitható újra.
  A visszatérítést külön kell elintézni. Késői sikeres IPN esetén az adminban
  `payment_review_required` jelzés rögzül, a törölt rendelés nem lesz újra aktív.
- Az átírt tranzakciós levelek magyarul készülnek, ahogy az eredeti sablonok is.
- Nincs automatikus készletfelszabadítás lejárt, fizetetlen rendeléseknél;
  az admin törlése szabadítja fel a foglalást.
- Az éles tárhely, az e-mail szolgáltató és az S3/SimplePay kereskedői kapcsolatok
  saját hozzáféréssel végzett ellenőrzést igényelnek.

A repó `backend` mappája a korábbi Python megoldás referenciaforrása;
az új telepítési csomag nem tartalmazza és semmit nem futtat belőle.
Napi adatbázis-mentés (cPanel Backup / mysqldump) és az `uploads` mappa mentése
szükséges. A visszaállítást külön tesztadatbázison próbáld ki.
