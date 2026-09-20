# Termékadatok szerkesztése

1. Kezelőfelület → Termékek → Új termék vagy Szerkesztés.
2. A Termékadatok és használati útmutató részben pipáld be a kívánt adatokat: Szín, Díszítés, Forma, Tömeg, Viasz, Illat, Készítés, Felső réteg, Illatjellemző.
3. Írd be az értékeket (például Tömeg: 200 g). A megnevezések is módosíthatók. A + Saját termékadat gombbal további sorokat adhatsz hozzá, összesen legfeljebb harmincat.
4. A magyar és angol szöveg külön szerkeszthető. Az üres angol mező helyett a magyar jelenik meg. A pipa nélküli és üres adatok nem jelennek meg a termékoldalon. A kikapcsolás nem törli az értéket.
5. A Használati útmutató mezőbe írd a termékhez tartozó tudnivalókat. Ha üres, nem jelenik meg külön útmutató.
6. Emojit másolással vagy Windows alatt a Win + pont billentyűvel írhatsz be. A sortörések megmaradnak. A leírások és az útmutató eszköztárában félkövér, dőlt, alcím és felsorolás választható; jelöld ki a szöveget, majd kattints a gombra. Az Előnézet mutatja a kész megjelenést. A szerkesztőben **félkövér**, *dőlt*, ## alcím és - felsorolás jelölések látszanak. HTML-kód nem futtatható.
7. A hosszú leírás most fent, a termékkép mellett látszik; a rövid a Részletek alatt. Üres hosszú leírásnál fent a rövid jelenik meg. A külön cseregomb a két mező tartalmát is felcseréli, magyarul és angolul. Ezt csak akkor használd, ha tényleg a szövegeket akarod áttenni; a megjelenési helyek eleve felcserélődtek.
8. Mentés és közzététel után nyisd meg a termékoldalt. A szerkesztőben is látható a termékadatok előnézete.

## Frissítés

A hinfini-webshop-frissites csomagból a frontend és a backend fájljait is frissítsd. A saját config.local.php és uploads maradjon meg. Új SQL-import nem szükséges: a mezők a meglévő termékdokumentumban tárolódnak. A korábbi termékek továbbra is működnek; az új mezők kezdetben üresek.

## A szeptember 20-i terméklista importálása

A frissítőcsomag public_html és backend-php mappájának feltöltése után frissítsd az adminoldalt Ctrl+F5-tel. A Termékek lapon kattints a **Dokumentum 19 termékének importálása** gombra. Ez hozza létre az adatbázisban a dokumentumból előkészített termékeket és a hiányzó kategóriákat. SQL-import nem szükséges.

Az új termékek piszkozatok: a dokumentumban nem szerepelt ár, készlet vagy termékfotó. Add meg ezeket, majd válaszd a Mentés és publikálás gombot. A már meglévő, azonos URL-azonosítójú terméknél a magyar tartalom frissül; ára, készlete, képei és publikálási állapota megmarad. Az ismételt import kihagyja a korábban importált termékeket, ezért későbbi szerkesztéseidet nem írja felül. Más termékeket nem töröl.

Kategóriák: Tégelyes gyertyák – 4 oz (4), Formagyertyák (5), Tégelyes gyertyák – 8 oz (2), Üveges gyertyák (2), Illatviaszok (6).

A dokumentum „Égési idő: tesztelés után feltüntetendő” belső megjegyzését nem publikáljuk. A mért értéket később az egyedi termékadatokhoz adhatod hozzá.

## Színválasztás

A termékszerkesztő Választható színek mezőjébe soronként egy színt írj. A formagyertyáknál az import a dokumentumban megadott tíz színt tölti be. A színválasztás kötelező, ha a lista nem üres. A termékkártyáról a vásárló a termékoldalra jut, ahol színt választhat.

A szín megjelenik a kosárban, a pénztárban, a rendelésben és a visszaigazoló e-mailben. Ugyanaz a termék több színben külön kosársor, de a készlet közös. A szerver csak a terméknél valóban engedélyezett színeket fogadja el.

A leírásokban egy üres sor választja el a bekezdéseket. Az egyszerű sortöréseket a megjelenítés szóközként kezeli, így a Wordből másolt szöveg a képernyő szélességéhez igazodik. A felsorolások és alcímek továbbra is külön blokkok.
