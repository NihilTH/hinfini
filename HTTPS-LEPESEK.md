# HTTPS beállítása cPanelen

## 1. A tanúsítvány ellenőrzése

A cPanel kezdőoldalán keress rá: **SSL**. Nyisd meg az **SSL/TLS Status**
(SSL/TLS állapot), vagy az **SSL/TLS Certificates** oldalt.
Keresd meg a `hinfinicandles.hu` és a `www.hinfinicandles.hu` sorát.
Ellenőrizd, hogy érvényes tanúsítvány tartozik-e mindkettőhöz.

Ha nincs tanúsítvány, és elérhető az AutoSSL futtatása, indítsd el a megfelelő
domainekre. A gombok elérhetősége a tárhely beállításaitól függ.
Ha nincs ilyen lehetőség vagy hiba látható, a hiba szövege alapján folytassuk;
nem kell rögtön fizetős tanúsítványt vásárolnod.

## 2. Kipróbálás

Nyisd meg a `https://hinfinicandles.hu` címet. Csak akkor folytasd az automatikus
átirányítással, ha nincs tanúsítványhiba. A böngésző biztonsági figyelmeztetését ne kerüld meg.

## 3. Automatikus átirányítás

A cPanel **Tartományok / Domains** oldalán keresd a domain sorában a
**Force HTTPS Redirect** kapcsolót, és kapcsold be. Ha inaktív, előbb a tanúsítvány
vagy a tárhely domainbeállításának hibáját kell megoldani.

Utána nyisd meg a `http://hinfinicandles.hu` címet: automatikusan a HTTPS-címre kell jutnod.

## 4. A webshop beállítása

A `backend-php/config.local.php` fájlban a `PUBLIC_SITE_URL` értéke legyen:
`https://hinfinicandles.hu` (a végén nincs perjel). Ha a www-s címet választod
véglegesnek, azt használd következetesen helyette.
A SimplePay értesítési címét később ugyanennek a domainnek a
`/api/payments/ipn` útvonalára kell beállítani HTTPS-sel.

A HTTPS nem helyettesíti az adatbázis bekötését: az adatbázisnevet, a felhasználót,
a jelszót és a táblák importját külön is el kell végezni.

Források: [cPanel SSL/TLS Status](https://docs.cpanel.net/cpanel/security/ssl-tls-status/),
[cPanel Domains](https://docs.cpanel.net/cpanel/domains/domains/).
