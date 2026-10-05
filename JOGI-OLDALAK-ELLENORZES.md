# Vállalkozói adatok és jogi oldalak – 2026. október 5.

## Feltöltés
A frissítési csomag public_html és backend-php mappáját is töltsd fel a megfelelő helyre. A config.local.php, feltöltött képek és privát számlák maradjanak meg. SQL-import nem szükséges. A frontend és backend jogi JSON-ja azonos verzió; mindkettőt frissítsd.

Elkészült: Kapcsolat, ÁSZF, Szállítás és fizetés, Elállás és visszaküldés, Adatkezelés, Süti beállítások magyar és angol tartalma, lábléc cégadatok, AAM jelölés. A szállítás díja és ingyenességi határa a pénztár konfigurációját használja; az ingyenesség kupon előtti részösszegre vonatkozik. Az új rendelések visszaigazoló e-mailjében a rendeléskor hatályos ÁSZF és elállási tájékoztató teljes szövege szerepel.

## Elállások kezelése
A lábléc Elállás a szerződéstől linkje az űrlaphoz vezet. A vásárló nyilatkozatát a rendszer rögzíti, letölthető elismervényt ad és e-mailt sorol be a vásárlónak, illetve a két beállított belső címre. Admin → Elállások alatt olvasható. Admin → E-mail naplóban ellenőrizd a kézbesítést. A cron mail:send/tasks:run rendszeres futtatása továbbra is szükséges. A beküldés nem törli a rendelést és nem térít vissza pénzt automatikusan: a jogosultságot, visszaküldést, visszatérítést és számlahelyesbítést az üzemeltető intézi. Az űrlap nem kér jelszót és nem ad ki rendelési adatot.

## Éles indulás előtt még ténylegesen tisztázandó
- Melyik futár szállít, milyen feladási/kézbesítési idővel? Az oldal nem állít kitalált 2–4 munkanapos ígéretet. A fuvarozó nevét és adatkezelési tájékoztatóját rendelés ELŐTT tedd közzé, amint a szerződés ismert.
- Erősítse meg Dominik az 1990 Ft-os házhozszállítást és 25000 Ft-os ingyenességi határt. Módosítás: SHIPPING_FEE_HOME / FREE_SHIPPING_FROM.
- A Barion és Számlázz.hu fiókban ugyanaz a hivatalos EV-név, adószám és székhely legyen. Béke utca 59. a visszaküldési cím, nem a székhely.
- A számlázási megőrzési határidőt az EV adózási formájára a könyvelő pontosítsa. Az adatkezelési határidők betartása üzemeltetési feladat: nincs automatikus teljes adat- és mentéstörlés. A régi, már nem szükséges ajánlatokat/képeket, leveleket és biztonsági mentéseket is kezelni kell.
- A Gmail másolat valódi adattovábbítás. Dominik ellenőrizze a használt Google-fiók szerződéses/adatvédelmi feltételeit; csak a szükséges hozzáférők lássák.
- Az opcionális Barion Pixel hozzájárulás nélkül nem töltődik be. A Barion szerződéses csomagját egyeztesd: ez nem Full Pixel marketingintegráció, és a csökkentett díj feltételeinek teljesítését nem igazolja.
- Minden éles termékhez tényleges fotó, helyes leírás, pozitív ár, valós készlet, használati/biztonsági tudnivalók kellenek. A meglévő termékadatokat ez a frissítés nem írja felül. A Barionhoz tesztelhető, valós kínálatot mutass.
- Saját kártyával végig kell tesztelni a jóváhagyott fizetést, a számlát, e-mailt és visszatérítést. Az online elfogadóhely még jóváhagyásra várhat: ennek állapotát a kód nem helyettesíti.

A vállalkozónak a feltételeket és a tényleges működést együtt kell ellenőriznie; ez a technikai frissítés nem jogi megfelelőségi tanúsítás. Fizetés élesítését nem kapcsolja be.

## Ellenőrzés
Privát ablakban nyisd meg a /kapcsolat, /aszf, /adatkezeles, /elallas, /sutik, /szallitas oldalakat mindkét nyelven. Ellenőrizd a telefon- és e-mail-linket, az űrlap visszaigazolását és a belső értesítéseket. A kosár összege, kuponkedvezmény, szállítás és fizetési összeg egyezzen. Régi rendelésekre az új ÁSZF nem kerül visszamenőlegesen rá.

Források (ellenőrizve 2026-10-05):
- https://njt.jog.gov.hu/jogszabaly/2014-45-20-22
- https://njt.jog.gov.hu/jogszabaly/1997-155-00-00
- https://www.hbmbekeltetes.hu/
- https://www.naih.hu/ugyfelszolgalat-kapcsolat
- https://www.barion.com/hu/adatvedelmi-tajekoztato/
