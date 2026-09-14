# H’INFINI — beállítás és használat, lépésről lépésre

A sajatdomain.hu és a SAJAT_ kezdetű értékek példák: mindenhol a saját cPanel-fiókodban látható adatokkal helyettesítsd őket. Ez az útmutató nem tartalmaz saját belépési adatot.

## 1. Miért nem látszanak a termékek?

Ha a https://sajatdomain.hu/api/products cím 503-as választ és `database_unavailable` hibát ad, kövesd az alábbi ellenőrzést. Ez adatbázis-hibát jelez; lehet hibás belépési adat, hiányzó tábla vagy jogosultság. A pontos ok a tárhely PHP hibanaplójában látható. A saját tárhely beállításaihoz innen nincs hozzáférésem.

A schema.sql csak táblákat hoz létre. A seed.sql mintatermékeket tölt be. Az update-studio.sql meglévő adatokat rendez át és az új funkciók tábláit adja hozzá; nem tölt be termékeket. A bolt csak a Publikált állapotú termékeket mutatja. A nulla készlet önmagában nem rejti el a terméket.

## 2. A frissítés feltöltése

1. cPanel → Fájlkezelő. Mentsd le a jelenlegi public_html és backend-php mappát. phpMyAdminban az adatbázisra kattintva az Exportálás fülön készíts mentést.
2. GitHub → Actions → a legújabb sikeres futás → Artifacts → hinfini-webshop-frissites. Töltsd le a ZIP-et.
3. A cPanel Fájlkezelőben menj a kezdőmappába: /cphome/SAJAT_CPANEL_FELHASZNALO. Itt egymás mellett látszik a public_html és a backend-php.
4. Ide töltsd fel és csomagold ki a ZIP-et. Engedd a csomagban lévő fájlok felülírását. A mappákat ne töröld előtte. Ne a public_html mappába csomagold az egész ZIP-et.
5. A frissítőcsomag nem tartalmaz saját config.local.php fájlt, és nem cseréli le az átirányításaidat. Az adatbázis-jelszó és a feltöltött képek megmaradnak.

## 3. Adatbázis-kapcsolat beállítása

1. cPanel → Manage My Databases. Ellenőrizd, hogy az SAJAT_ADATBAZIS_FELHASZNALO felhasználó hozzá van rendelve az SAJAT_ADATBAZIS_NEVE adatbázishoz. Az összes jogosultság kijelölése után nyomd meg a Módosítások elvégzése gombot.
2. Fájlkezelő → backend-php → config.local.php → Szerkesztés. Ha nincs ilyen fájl, másold le a config.example.php fájlt config.local.php néven ugyanide.
3. A meglévő sorok értékét módosítsd ezekre; ne töröld a fájl többi beállítását:

```php
'DB_HOST'=>'localhost',
'DB_PORT'=>3306,
'DB_NAME'=>'SAJAT_ADATBAZIS_NEVE',
'DB_USER'=>'SAJAT_ADATBAZIS_FELHASZNALO',
'DB_PASSWORD'=>'IDE_AZ_ADATBAZIS_FELHASZNALO_JELSZAVA',
'PUBLIC_SITE_URL'=>'https://sajatdomain.hu',
```

4. A DB_PASSWORD helyére az adatbázis-felhasználó létrehozásakor választott jelszó kerül. Ez különbözhet a cPanel és az admin jelszavától. Ha elfelejtetted, a Manage My Databases oldalon állíts be újat az SAJAT_ADATBAZIS_FELHASZNALO felhasználónak, majd ugyanazt írd ide.
5. Az idézőjeleket és a sorvégi vesszőket tartsd meg. PHP-ban az egyszeres idézőjelet a jelszón belül így kell írni: \'; a fordított perjelet így: \\. A jelszót ne küldd el üzenetben.
6. Mentsd a fájlt. A cPanel PHP-verziókezelőjében legyen PHP 8.3 vagy újabb; a pdo_mysql és mbstring bővítmény legyen elérhető. Ha nem találod, kérd a Rackhost segítségét ezek bekapcsolásához.

## 4. SQL betöltése — a jelenlegi állapot szerint

1. cPanel → phpMyAdmin → bal oldalon kattints az SAJAT_ADATBAZIS_NEVE adatbázisra.
2. Ha üres, az Importálás fülön először a csomag backend-php/database/schema.sql fájlját válaszd és indítsd el az importálást. Hiba esetén állj meg, és a hibaüzenetet küldd el.
3. Ha már vannak benne a korábbi webshop táblái, ne töröld őket. Ha az előző, egyedi gyertyás frissítés SQL-jét még nem importáltad, importáld a backend-php/database/update-studio.sql fájlt. Ez a régi kellékeket archiválja és az öt kért kategóriára állítja át a kínálatot. Ha már lefutott, nem kell ismét futtatni.
4. Ha a products tábla üres, két lehetőséged van: saját termékeket hozol létre az adminból, vagy kipróbáláshoz importálod a seed.sql fájlt. Ez négy mintaterméket tartalmaz, mintaképekkel és mintaárakkal. Ezek nem a saját kínálatod: éles értékesítés előtt szerkeszd vagy archiváld őket.
5. Meglévő termékekre ne importálj újra mintákat javításként. Az archivált vagy piszkozat termékeket az adminban ellenőrizd.
6. Ellenőrzéshez az SQL fülön futtathatod a backend-php/database/ellenorzes.sql tartalmát. Ez csak olvas, semmit sem módosít. Megmutatja az adatbázis nevét, a termékek számát állapotonként, és a kategóriákat. Ha hiányzó táblát jelez, a táblák létrehozása nem fejeződött be.
7. Nyisd meg a https://sajatdomain.hu/api/products címet. Ha termékadatokat látsz, a kapcsolat működik. A [] azt jelenti, hogy nincs publikált termék. A database_unavailable még hibát jelent: a cPanel Hibák menüjében vagy a PHP error_log fájlban keresd a kapcsolódó PDO hibát. A megosztott képen takard ki a belépési adatokat.

## 5. Hol találom az admin jelszót?

1. Fájlkezelő → backend-php → config.local.php → Szerkesztés.
2. Keresd ezt: 'ADMIN_TOKEN'=>''. Az idézőjelek közötti érték a belépőkódod. Nincs külön felhasználónév, és nem az adatbázis-jelszóval kell belépni.
3. Ha üres, te állítod be: a jelszókezelődben generálj legalább 32 karakteres véletlen betű-szám kódot, másold az idézőjelek közé, és mentsd el biztonságosan magadnak. Ne a config.example.php fájlt szerkeszd ehhez.
4. Nyisd meg: https://sajatdomain.hu/admin . Másold be a kódot és kattints a belépésre.
5. Ha elfelejtetted, ugyanebben a fájlban új értéket adhatsz meg. Ezután az új kóddal lépj be. A régi kód érvénytelenné válik.

## 6. Saját termék feltöltése

1. Admin → Termékek → Új termék.
2. Add meg a magyar nevet, és válaszd ki a kategóriát. Az angol mezők az angol oldalhoz tartoznak.
3. Az URL-azonosító mező melletti generáló gombbal készíts azonosítót a névből; minden terméké legyen különböző.
4. Add meg az árat egész forintban (például 4990), a készletet darabszámban, és az egységet (például 200 g).
5. Töltsd ki a rövid és a részletes leírást.
6. Képek → Kép kiválasztása → töltsd fel a saját fotót, majd válaszd ki. A galériához további képeket is hozzáadhatsz. A képleírás röviden mondja el, mi látható a fotón.
7. Ha a főoldalon is ki szeretnéd emelni, jelöld ki a Kiemelt lehetőséget.
8. Nyomd meg a Mentés és publikálás gombot. A Mentés piszkozatként csak elmenti, a vásárlók még nem látják.
9. Nyisd meg a Bolt oldalt, és ellenőrizd a saját terméket, az árát és képeit.

## 7. Meglévő termék és kategória módosítása

- Termékek → a kívánt sorban a ceruza/Szerkesztés gomb. A név, ár, készlet, kategória, leírás és képek módosíthatók, majd menthetők.
- Ha egy korábbi termék eltűnt, kapcsold be az archivált termékek megjelenítését. Szerkesztéskor válassz megfelelő új kategóriát és mentsd publikálva. Csak ténylegesen eladásra szánt terméket állíts vissza.
- Kategóriák → Új kategória vagy Szerkesztés. Megadhatod a magyar/angol nevet, képet, leírást, sorrendet és az aktív állapotot. Termék által használt kategória nem törölhető: előbb sorold át a termékeket.
- Médiatár → ide külön is tölthetsz fel képeket, majd a termékszerkesztőből kiválaszthatod őket.

Az admin termék-, kategória- és képkezelése már be van építve. Használatához működő adatbázis-kapcsolat és a fenti belépőkód szükséges. E-mailhez, átutaláshoz és kuponokhoz a FRISSITES-STUDIO.md tartalmaz további lépéseket.
