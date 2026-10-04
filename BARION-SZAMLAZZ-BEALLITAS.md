# Barion, Számlázz.hu és rendelési értesítések

A frissítés telepíti az összekötést, de nem kapcsolja be magától a fizetést és a számlázást. A Barion-jóváhagyás és a saját kulcsok még szükségesek. Először teszteljünk. A tesztekhez külön Barion tesztelfogadóhely és külön Számlázz.hu tesztfiók kell; az éles fiókkal ne tesztelj.

## 1. Frissítés cPanelben

1. Készíts biztonsági mentést a jelenlegi fájlokról és az adatbázisról.
2. A csomag `public_html` tartalmát a meglévő `public_html` mappába, a `backend-php` tartalmát a tárhely gyökerében lévő `backend-php` mappába másold.
3. A saját `config.local.php`, az `uploads` és a később létrejövő `private-invoices` mappa maradjon meg. Ne töröld a teljes mappát.
4. Ehhez a frissítéshez nem kell SQL-import. Frissítsd a böngészőt Ctrl+F5-tel.

## 2. A beállítások helye

A már működő `/cphome/rh75046/backend-php/config.local.php` fájlt szerkeszd. Az adatbázis és az ADMIN_TOKEN meglévő értékeit hagyd meg. Az alábbi sorokat a `return [` és `];` közé illeszd. Ha egy kulcs már szerepel, azt módosítsd, ne szerepeljen kétszer!

```php
'PUBLIC_SITE_URL' => 'https://hinfinicandles.hu',
'PAYMENT_PROVIDER' => 'barion',
'BARION_ENABLED' => false,
'BARION_ENV' => 'sandbox',
'BARION_PIXEL_ENABLED' => false,
'BARION_TEST_PIXEL_ID' => '',
'BARION_PIXEL_ID' => '',
'BARION_TEST_POS_KEY' => '',
'BARION_TEST_PAYEE_EMAIL' => '',
'BARION_POS_KEY' => '',
'BARION_PAYEE_EMAIL' => '',

'EMAIL_PROVIDER' => 'php_mail',
'EMAIL_FROM' => 'hinfinicandles@hinfinicandles.hu',
'EMAIL_FROM_NAME' => "H'INFINI Candles",
'EMAIL_REPLY_TO' => 'hinfinicandles@hinfinicandles.hu',
'SUPPORT_EMAIL' => 'hinfinicandles@hinfinicandles.hu',
'ORDER_NOTIFY_EMAIL' => 'hinfinicandles@hinfinicandles.hu',
'ORDER_NOTIFY_COPY_EMAIL' => 'hinfinicandles@gmail.com',

'INVOICE_PROVIDER' => 'szamlazz',
'INVOICE_TRIGGER' => 'paid',
'SZAMLAZZ_ENABLED' => false,
'SZAMLAZZ_TEST_AGENT_KEY' => '',
'SZAMLAZZ_AGENT_KEY' => '',
'INVOICE_VAT' => 'AAM',
'SZAMLAZZ_E_INVOICE' => false,
'SZAMLAZZ_PREFIX' => '',
```

A kulcsokat csak ebben a védett fájlban add meg, ne GitHubon, képernyőképen vagy üzenetben. A `config.example.php` szerkesztése nem változtatja meg a működő oldal beállításait.

## 3. Barion teszt

- A tesztelfogadóhely POSKey kulcsát írd a `BARION_TEST_POS_KEY` mezőbe, a tesztelfogadóhely tulajdonosának Barion e-mail-címét a `BARION_TEST_PAYEE_EMAIL` mezőbe. Ez nem feltétlenül az ügyfélszolgálati e-mail!
- A `BARION_ENV` maradjon `sandbox`. A teszt idejére `BARION_ENABLED` legyen `true`. Lehetőleg külön tesztmásolaton próbáld; a nyilvános boltban ne hagyj bekapcsolt tesztfizetést.
- A fizetés visszajelzési címe automatikusan: `https://hinfinicandles.hu/api/payments/barion/callback`.
- A fizetés után a Barion saját szerverét kérdezzük le. A böngészőben megadott állapot nem igazol fizetést.
- Sikeres, megszakított és lejárt fizetést is próbálj ki. A rendelésoldal a visszatérés után frissíti az állapotot.
- Bizonytalan fizetésindításnál nincs automatikus második terhelés. Ellenőrizd a rendelésazonosítót a Barionban, mielőtt új rendelést készítesz.

## 4. Számlázz.hu teszt és számla

- A tesztfiók Számla Agent-kulcsa a `SZAMLAZZ_TEST_AGENT_KEY` mezőbe kerül. Az éles fiók külön kulcsát később a `SZAMLAZZ_AGENT_KEY` mezőbe írd.
- A teszt idejére `SZAMLAZZ_ENABLED` legyen `true`. A sandbox fizetés kizárólag a tesztkulcsot használja. A kulcsok tényleges teszt/éles fiókhoz tartozását a tulajdonos ellenőrizze: a szolgáltató ugyanazt az API-címet használja mindkettőhöz.
- Ez az integráció HUF, magyar számlázási cím és **AAM** termék/szállítás mellett működik. Más adózás előtt módosítás kell.
- A számlakibocsátó hivatalos adatait a Számlázz.hu-fiókból veszi a szolgáltató. Ott Sopronyi Dominik egyéni vállalkozó hivatalos adatai és a Temető utcai székhely szerepeljen. A Béke utcai visszaküldési cím nem helyettesíti a székhelyet.
- A pénztárban külön számlázási név/cím és magyar adószám is megadható; ha nincs eltérés, a rendelési név és cím lesz a számlán.
- A kupon és a szállítás külön tétel. A rendszer ellenőrzi a számla és a rendelés végösszegének egyezését.
- `SZAMLAZZ_E_INVOICE=false`: papíralapú számla PDF-másolata; `true`: e-számla, csak a megfelelő Számlázz.hu szolgáltatással és elfogadott folyamattal. Az e-mailes PDF önmagában nem jelenti, hogy e-számla készült.
- A kártyás fizetéskor történő számlázás és a teljesítés dátumának szabályát élesítés előtt a könyvelővel erősítsétek meg. A jelenlegi `paid` folyamat a fizetés budapesti dátumát használja teljesítésként, és normál, fizetett számlát készít. Előleg-/végszámla és egyedi gyertyák automatikus számlázása nincs ebben a folyamatban.
- A számla PDF-je a `backend-php/private-invoices` privát mappába kerül. A vásárló egy külön, a webshop arculatához illő levélben kapja a letöltési gombot. A Számlázz.hu saját e-mailjét nem indítjuk el, így nem megy ki duplán.

## 5. Cron – ugyanaz a feladat küldi a leveleket és készíti a számlákat

A meglévő cron parancs is működik:

```text
/usr/local/bin/php /cphome/rh75046/backend-php/bin/console.php mail:send >> /cphome/rh75046/mail-cron.log 2>&1
```

Ha a tárhely más PHP-parancsot adott, a jelenleg működő PHP-elérési utat használd. Ütemezés: Perc `*`, Óra `*`, Nap `*`, Hónap `*`, Hétköznap `*` = percenként. A meglévő feladatot szerkeszd, ne hozz létre mellé második példányt.

A feldolgozás sorrendje: függő Barion-fizetések ellenőrzése → várakozó számlák → e-mail-küldés. A PHP CLI-nek a weboldallal azonos konfigurációt kell olvasnia. Számlázási vagy mail-hiba nem vonja vissza a valóban sikeres fizetést.

## 6. Ellenőrzés az adminban

- Rendelések: fizetési állapot és Barion-azonosító.
- Számla: várakozik → feldolgozás → kiállítva. E-mail napló: a vevő és a két belső cím külön sorban.
- A másolat önálló levél, külön hibakezeléssel. A vásárló levelére nem kerülnek rá a belső címek.
- A két belső cím az új rendelésről, fizetésről, sikertelen fizetésről, törlésről, alacsony készletről és egyedi ajánlatkérésről kap értesítést. A vásárló számlája csak a vásárlónak megy.
- A korábban sorba állított levelek címzettje nem változik meg visszamenőleg.
- A „kézi ellenőrzés” vagy tartós „feldolgozás alatt” számlaállapotot ne nullázd le vaktában: lehet, hogy a számla már elkészült, csak a válasz szakadt meg. Keresd a Számlázz.hu-ban a rendelésazonosítót. A rendszer ilyenkor szándékosan nem küldi be újra a számlakészítést. Ha megvan, számlaszámot és biztonságos számlahivatkozást kézzel lehet egyeztetni/rögzíteni; kérj segítséget, mielőtt újra kiállítod.
- Törölt rendelésre későn beérkező fizetés vagy több sikeres terhelés kézi ellenőrzést kap. Visszatérítés és számlasztornó a szolgáltatói felületeken intézendő; az adminbeli rendeléstörlés ezeket nem végzi el.

## 7. Élesítés, amikor jóváhagyta a Barion

1. A teljes tesztfolyamat legyen sikeres, a PDF tartalmát, két belső értesítést és a vásárlói leveleket is ellenőrizzétek.
2. Ellenőrizzétek a Barion választott csomagjához tartozó megjelenítési/Pixel és adatkezelési követelményeket. Az alap, csalásmegelőzési Pixel elő van készítve: az elfogadóhely adatai között lévő BP-… azonosítót a megfelelő TEST/éles PIXEL_ID mezőbe írjátok, majd BARION_PIXEL_ENABLED=true. Az adatkezelési tájékoztatót ehhez aktualizálni kell. Admin- és rendelésoldal közvetlen megnyitásakor nem töltődik be a Pixel; az elfogadóhely ellenőrzésekor a SPA-megjelenést is teszteljétek. Full marketing Pixel és marketing-hozzájárulás küldése nincs bekötve ebben a csomagban.
3. Éles POSKey és Barion-fogadó e-mail a nem TEST nevű mezőkbe; éles Számla Agent-kulcs a `SZAMLAZZ_AGENT_KEY` mezőbe.
4. `BARION_ENV='live'`, majd `BARION_ENABLED=true`, `SZAMLAZZ_ENABLED=true`.
5. Egy valódi rendelés teljes folyamatát ellenőrizzétek. A kártyaadatokat a Barion oldala kezeli.
6. Az egyedi gyertyák átutalási számlaszáma addig marad üres, amíg Dominik megadja az új számla adatait. Az ajánlatkérés ettől továbbra is használható.

Hivatalos dokumentáció: https://docs.barion.com/Accepting_your_first_online_payment ; https://docs.barion.com/Payment-PaymentState-v4 ; https://docs.szamlazz.hu/hu/agent/generating_invoice/xml ; https://docs.szamlazz.hu/hu/agent/generating_invoice/response
