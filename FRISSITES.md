
## 2026. október 2. — Angol felület és termékfordítások

1. Töltsd le a sikeres GitHub Actions futás `hinfini-webshop-frissites` csomagját.
2. A csomag `public_html` mappájának tartalmát másold a tárhely `public_html` mappájába, a `backend-php` tartalmát pedig a mellette található `backend-php` mappába. A saját `config.local.php` fájlodat és a feltöltött képeket őrizd meg.
3. Az adminban nyisd meg a **Termékek** fület, és kattints az **Angol fordítások betöltése** gombra. Ez nem a régi „Dokumentum 19 termékének importálása” gomb!
4. A visszajelzés megmutatja, hány termék és kategória angol mezőit mentette el. Az árakat, készletet, képeket és magyar szöveget nem módosítja. Nem szükséges SQL-t importálni.
5. Frissítsd az oldalt (Ctrl+F5), válts EN nyelvre, majd ellenőrizd a termékeket és az egyedi ajánlatkérő űrlapot.

A fordításcsomag az október 2-án elérhető 19 termék magyar szövegének fordítása. Pontos forrásszöveg-egyezést ellenőriz: az azóta átírt magyar szövegre nem tesz rá régi fordítást. A később egyedileg javított angol mezőket ismételt betöltéskor megőrzi. Új termékhez vagy új magyar szöveghez továbbra is ki kell tölteni a megfelelő angol mezőket a szerkesztőben. Az angol vásárlói nézet a csomag ismert fordításait már a mentés előtt is megjeleníti, az admin gomb ezek adatbázisba mentését végzi.
