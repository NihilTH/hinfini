# Termékfeltöltés egyszerűen

A termékeket a webshop saját kezelőfelületén töltöd fel. Ehhez később nem kell cPanel vagy programozás.

## Először egyszer kell beállítani

A feltöltés akkor működik, ha az adatbázis tábláit már importáltuk és a
`backend-php/config.local.php` fájlban megadtuk az adatbázis elérését.
Az `ADMIN_TOKEN` értéke a webshop belépési kulcsa. Ez különbözik az adatbázis
jelszavától és a cPanel jelszavától. Ne küldd el képernyőképen.
A saját domain HTTPS-címét a `PUBLIC_SITE_URL` beállításban is meg kell adni.

## Egy termék feltöltése

1. Nyisd meg: **https://hinfinicandles.hu/admin**.
2. Írd be a webshop belépési kulcsát, majd kattints a **Belépés** gombra.
3. Válaszd a **Termékek** fület, majd az új termék hozzáadására szolgáló gombot.
4. A magyar név mezőbe írj például: **Vaníliás szójagyertya**.
5. Az URL-azonosítónál kattints a névből generálás gombra. Például
   `vanilias-szojagyertya` lesz belőle. Ez a termék webcímének része, ezért legyen egyedi.
6. Válassz kategóriát, például **Gyertyák**. Az alkategóriát magyarul add meg,
   például **Edényes gyertya**, vagy hagyd üresen.
7. Töltsd ki a rövid leírást, például: **Kézzel öntött, vaníliaillatú szójagyertya.**
8. Add meg az árat egyszerű számként: **4990**. Ne írj mellé Ft-ot.
9. Az egységhez írhatsz **200 g** értéket. A készlethez írd, hány darab adható el,
   például **12**. Nulla készletnél a termék elfogyottként jelenik meg.
10. A részletes leíráshoz írd be a termék valós jellemzőit, méretét, anyagát
    és a hozzá tartozó használati útmutatást. Magyar mezőbe magyar szöveget írj;
    az angol mezők külön vannak, és később is kitölthetők.
11. A címkéket magyarul, vesszővel elválasztva add meg: **vanília, szójaviasz, ajándék**.
12. A főképnél kattints a kép kiválasztására. A megnyíló médiatárban tölts fel
    egy JPG, PNG vagy WebP képet (legfeljebb 5 MB), majd válaszd ki.
    A képleíráshoz írd például: **Vaníliás szójagyertya borostyánszínű üvegben**.
13. A galériához további képeket is hozzáadhatsz.
14. Ha még dolgozol rajta, válaszd a **Mentés piszkozatként** lehetőséget.
    Ha kész, kattints a **Mentés és publikálás** gombra.
15. Nyisd meg a boltot, és ellenőrizd a termék képét, árát, leírását és készletét.

**Kiemelt termék:** pipáld be a kiemelést, ha szeretnéd a kezdőlapon megjeleníteni.
A kezdőlap legfeljebb hat kiemelt terméket mutat.

## Meglévő termék javítása

Termékek → keresd meg → Szerkesztés → javítsd a mezőt → Mentés.
Elrejtéshez válaszd a rejtett állapotot. Végleges kivonáshoz használd az archiválást.

## Új kategória

Kategóriák → új kategória → töltsd ki az azonosítót és a **magyar megnevezést** → Mentés.
A magyar megnevezést mindig add meg, mert ezt látják a magyar vásárlók.

## Ha nem sikerül

- **Nem lehet belépni:** ellenőrizd a webshop saját belépési kulcsát.
- **A kép nem tölthető fel:** legyen támogatott formátum és 5 MB alatti méret.
- **Nem látszik a termék:** legyen publikált állapotú, majd frissítsd a boltot.
- **Nem tehető kosárba:** a készlet legyen legalább 1.
- **Nem menthető:** legyen név, kategória és egyedi URL-azonosító.
- **Angol saját szöveg jelenik meg:** a termék magyar mezőjét vagy a kategória magyar
  megnevezését javítsd. A rendszer nem fordítja le automatikusan az általad beírt szabad szöveget.
