# Biztonsági átnézés — 2026-09-13

## Eredmény és hatókör

A nyilvános repó főágát és PHP-frissítési ágát, a 18 elérhető commitot (nem sekély klón), 240 szöveges Git-objektumot, a PHP hozzáféréskezelést, fizetési értesítéseket, képfeltöltést, levélsablonokat és csomagolást vizsgáltam. Az élő főoldal HTML-jét csak olvastam; vásárlói adatot, adminbelépést és fizetést nem próbáltam élőben. Ez célzott kódellenőrzés, nem teljes behatolási teszt vagy garancia.

## Fontos találatok

1. **Magas: külső szkriptek a vásárlói és adminoldalakon.** A frontend/public/index.html az Emergent szkriptjét és PostHog-kódot töltött be, kikapcsolt követési alapállapot vagy oldal szerinti kizárás nélkül. A JavaScript az oldal DOM-jához és az admin sessionStorage-jához is hozzáférhet. Az élő főoldalon is jelen volt a kód. Eltávolítva. Nem állapítottam meg, hogy a szolgáltatónál milyen adatok vagy felvételek vannak; ehhez a szolgáltatói naplók és a projekt beállításai szükségesek.
2. **Magas, ha használatban volt: rögzített hitelesítőadatok a régi Python-tesztekben.** Admin belépőkód és SimplePay aláírókulcs szerepelt a backend/tests/backend_test.py fájlban; az adminadat tesztjelentésbe is bekerült. Az értékek aktuális érvényességét nem próbáltam ki. A teszt most kizárólag környezeti változókból olvas, és nem használ alapértelmezett távoli tesztcélt. A jelentésből töröltem az értéket. **A Git-előzmény és a főág ettől még tartalmazhatja: ha valaha használtátok, vissza kell vonni/cserélni.** A történelem átírása nem helyettesíti a kulcscserét.
3. **Közepes, régi Python-változat: vendégrendelés túl sok adatot adott vissza.** A korábbi kizárásos szűrés nevet, címet, e-mailt és később hozzáadott mezőket is visszaadhatott az azonosító ismeretében. Engedélyezett mezőkre korlátoztam. A PHP ezt már eleve szűkítette. Az azonosító birtokában továbbra is látható a termékösszesítő és az állapot; a rendelési linket privátként kell kezelni.
4. **Közepes: csomagolási kockázat.** A korábbi tiltólista a pontos konfigurációs fájlt kizárta, de például egy más néven mentett másolat vagy napló bekerülhetett volna. A backend csomagolása most név és könyvtár szerinti engedélyezőlistát használ. Nem találtam bizonyítékot korábbi ilyen tartalmú csomagra; régi GitHub-artifactokat és a tárhely összes mentését nem ellenőriztem.
5. **Közepes: rendelési/hírlevél-visszaélés.** Az ismételt kérések levélküldést és készletfoglalást okozhattak külön korlát nélkül. IP-alapú órás korlát került a két nyilvános végpontra. Ez nem teljes botvédelem: elosztott források ellen további védelem kellhet. A be nem fizetett rendelések készletének automatikus felszabadítása továbbra sincs általánosan megoldva.

## További védelem

- No-referrer irányelv az oldalban és az API-válaszokban: a rendelési URL ne menjen tovább hivatkozóként.
- A teljes telepítés Apache-fájljába keretezés elleni fejléc és érzékeny fájltípusok tiltása került. A már meglevő backend/.htaccess tiltást megőriztem.
- Automatikus csomagellenőrzés figyeli a követőkód visszakerülését és a privát fájlok engedélyezőlistáját.
- A jogosulatlan admin-rendelés, e-mail, hírlevél és egyedi kérés lekéréshez integrációs ellenőrzés került.

## Ellenőrzött meglévő védelmek

A PHP adminútvonalak belépőkódot igényelnek, üres kóddal nem engednek be, és korlátozzák a sikertelen próbálkozásokat. Az SQL lekérdezések paraméterezettek, a táblanevek engedélyezőlistából jönnek. A SimplePay-aláírást, kereskedőt és tranzakciót ellenőrzi a backend. Az ügyfél által feltöltött egyedi kép privát mappában marad és csak adminjoggal tölthető le. A nyilvános képkiszolgálás korlátozott fájlnév- és MIME-szabályokat használ. A levélsablon HTML-escape-et alkalmaz. Ezek az ellenőrzött kódra vonatkozó megállapítások, nem teljes körű biztonsági bizonyítékok.

## Amit nem tudtam teljesen igazolni

A függőségek Yarn-advisory lekérdezése 45 másodperc után időtúllépéssel leállt, ezért a függőségeket nem minősítem sérülékenységmentesnek. A tárhely config.local.php tartalmát, cPanel-hozzáféréseket, szolgáltatói naplókat, adatmegőrzést, régi ZIP-eket és a tényleges kulcshasználatot nem láttam. A Google Fonts és a külső termékfotók továbbra is hálózati kérést okoznak a szolgáltatóhoz; a követőkód eltávolítása ezeket nem szünteti meg.

## Telepítés és szükséges saját lépések

1. Mentés után frissítsd a public_html tartalmát és a backend-php fájljait a hinfini-webshop-frissites csomagból, a kezdőkönyvtárba kicsomagolva. Ne töröld a saját config.local.php fájlt és feltöltéseidet. SQL-import nem kell, ha az előző frissítés public_limits táblája már létezik.
2. Az új oldal betöltése után Ctrl+F5, zárd be a régi adminlapokat. A config.local.php ADMIN_TOKEN értékét cseréld új véletlen kódra, majd lépj be újra. Erre azért van konkrét ok, mert a korábbi külső szkriptek az adminlapon is futottak.
3. A korábbi tesztkulcsokat ne használd. Ha azokhoz tartozó SimplePay-kulcs valaha aktív volt, kérj újat a szolgáltatótól. A tesztkulcsot is cserélni kell, ha még él. Ne küldj titkos értékeket beszélgetésben.
4. A frissítőcsomag szándékosan nem írja felül a saját HTTPS-átirányításodat. A public_html/.htaccess ELEJÉRE illeszd ezt; a régi szabályokat hagyd meg:

```apache
<IfModule mod_headers.c>
Header always set Referrer-Policy "no-referrer"
Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "DENY"
</IfModule>
<FilesMatch "(?i)(^\.|\.(sql|log|bak|env|zip)$|^config\..*\.php$)">
Require all denied
</FilesMatch>
```

5. A backend-php mappa maradjon a public_html mellett. A mentések és SQL-exportok ne legyenek a public_html-ban.
6. A javítások a codex/php-mysql ágon és az 1-es PR-ban vannak. A főágat és a régi Git-előzményt nem írtam át. A kulcscserék után a PR egyesítése, régi artifactok és érintett előzmények kezelése külön teendő.

Hivatkozások: [PostHog konfiguráció](https://posthog.com/docs/libraries/js/config), [Referrer-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy).
