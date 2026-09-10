# Webshopfrissítés — kész gyertyák és egyedi ajánlatkérések

Ez a frissítés a felületet és a PHP-rendszert is módosítja. A korábbi, csak felületet tartalmazó ZIP már nem elegendő.

1. cPanelben készíts biztonsági mentést az adatbázisról és a fájlokról.
2. A GitHub Actions sikeres futásából töltsd le a **hinfini-webshop-frissites** ZIP-et.
3. A cPanel fájlkezelőben töltsd a `/cphome/rh75046` könyvtárba és ott csomagold ki. A ZIP `public_html` és `backend-php` mappát tartalmaz.
4. A csomag megőrzi a saját `backend-php/config.local.php`, feltöltések és `public_html/.htaccess` fájlokat. Ezeket ne töröld.
5. phpMyAdmin → `rh75046_hinfini` adatbázis → Importálás → a ZIP-ben lévő `backend-php/database/update-studio.sql` fájl → Importálás. A korábbi telepítés tábláinak már létezniük kell.
6. Ez létrehozza az új táblákat és az öt kategóriát. A korábbi alapanyagokat archiválja, a régi kategóriákat kikapcsolja. A meglévő rendeléseket megőrzi. Útmutatók többé nem érhetők el a publikus oldalon. A migráció a kategóriákat az új kialakításra állítja: egyszer végezd el a frissítéskor.
7. Frissítsd a weboldalt, majd lépj be a saját `/admin` felületre.

## Egyedi gyertyák

Az **Egyedi lehetőségek** fülön soronként add meg a ténylegesen választható illatokat, tartókat és szövegszíneket. Kezdetben az illat és a tartó egyeztetést kér: nincs kitalált elérhető választék.

A vásárló az **Egyedi gyertyák** oldalon ajánlatot kér. Képe legfeljebb 5 MB, JPG/PNG/WebP lehet. A képeket az adminisztrátori belépés védi, nem a nyilvános médiatár tárolja.

**Egyedi kérések → Ajánlat összeállítása**: add meg a teljes fizetendő összeget (szállítással együtt) és a pontos tartalmat, elkészítési időt, szállítást, ajánlati érvényességet. A küldés előtt a felület megerősítést kér. Az ajánlat e-mailben megy ki, az átutalási adatok automatikusan hozzáadódnak.

A saját konfigurációban add meg:

```php
'BANK_ACCOUNT_NAME' => 'A kedvezményezett valódi neve',
'BANK_ACCOUNT_NUMBER' => 'A valódi bankszámlaszám',
'PUBLIC_SITE_URL' => 'https://hinfinicandles.hu',
```

A vásárló kizárólag átutalással fizet. A banki beérkezés ellenőrzése után az **Átutalás beérkezett** gombbal jelöld fizetettnek. Ez nem banki integráció: kizárólag a tényleges jóváírás után kattints rá. Az egyedi kérések a normál kosártól és SimplePay fizetéstől elkülönülnek.

## Rendelési e-mailek

A normál rendelés rögzítéséről, sikeres/sikertelen fizetéséről, feladásáról és törléséről már van levélküldés. Az új egyedi ajánlatkérés visszaigazolást és belső értesítést is kap. Az **E-mail naplóban** ellenőrizhető az állapot és kérhető újraküldés.

A PHP levelezés beállítható a tárhelyen létrehozott feladócímhez:

```php
'EMAIL_PROVIDER' => 'php_mail',
'EMAIL_FROM' => 'SAJAT_LETEZO_FELADOCIM',
'EMAIL_REPLY_TO' => 'SAJAT_VALASZCIM',
'ORDER_NOTIFY_EMAIL' => 'SAJAT_ERTESITESI_CIM',
'SUPPORT_EMAIL' => 'SAJAT_UGYFELSZOLGALATI_CIM',
```

A példák helyére valódi e-mail-címeket írj. A már meglévő Resend/SendGrid beállítás is megtartható. `none` esetén nincs kiküldés. A feladódomain levelezési beállításai és a tárhely kimenő levélküldése szükségesek a kézbesítéshez.

cPanel → Cron-feladatok: percenként futtasd (a tárhelyen elérhető PHP 8.3 útvonalával):

```text
/usr/local/bin/php /cphome/rh75046/backend-php/bin/console.php mail:send
```

A SENT állapot azt jelzi, hogy a szolgáltató/tárhely elfogadta a levelet, nem bizonyítja a postaládába kézbesítést. Saját címre küldött próbalevéllel és az e-mail-naplóval ellenőrizd.

## Kuponok

**Kuponok → Új kupon**: kód, százalékos vagy forintos kedvezmény, minimum termékérték, kezdő- és lejárati idő, összes felhasználási limit. A 0-s limit korlátlan felhasználást jelent. Inaktív kupont nem lehet beváltani.

A pénztárban a **Beváltás** gomb ellenőrzi a kupont. A rendelés véglegesítésekor a szerver újra ellenőrzi és számolja az összeget. Egy rendeléshez egy kupon használható, a kedvezmény csak a termékösszeget csökkenti. A szállítás díját a kedvezmény előtti termékérték határozza meg. A nulla végösszegű bankkártyás rendelést a rendszer nem fogadja el.

A felhasználást a rendelés létrejöttekor lefoglaljuk. Ha a rendelést törlöd, a felhasználás felszabadul. A fizetetlen, de nem törölt rendelés is foglalja a kupont.

## Események és termékek

Az **Események** fülön valós eseményeket adhatsz meg névvel, időponttal, helyszínnel és leírással. A nyilvánosság kikapcsolásával elrejthetők. Kezdetben nincs kitalált esemény.

Termékfeltöltés: **Termékek → Új termék**. Az öt kategória: Gyertyák, Illatviasz, Formagyertyák, Asztali dísz, Egyéb. A korábbi TERMEKFELTOLTES.md az űrlap használatához továbbra is alkalmazható; ez az üzemeltetőnek szól, nem publikus tananyag.

## Számlázás

A SimplePay bankkártyás fizetés és a számlakiállítás külön funkció. A jelenlegi változatban a saját számlázóban kiállított számla száma és HTTPS letöltési címe rögzíthető a normál rendelés adatlapján, majd a **Mentett számla küldése e-mailben** gombbal elküldhető. A mentés önmagában nem küld levelet.

**Automatikus számlakiállítás még nincs bekötve.** Ehhez meg kell nevezni a számlázót (például Számlázz.hu vagy Billingo), és szükségesek a szolgáltatói hozzáférések, a vállalkozás számlázási/áfabeállításai. A webshop rendelés-visszaigazolása nem számla. Az egyedi átutalásos munkák számláját is a saját számlázóban kell kiállítani.
