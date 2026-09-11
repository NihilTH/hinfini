# H’INFINI Candles — PHP + MySQL

A webshop PHP 8.3+ háttérrendszerrel és MySQL 8.0+ / MariaDB 10.6+ adatbázissal.
A meglévő kétnyelvű React felület megmarad, statikus fájlként telepíthető.
A tárhelyen Python, MongoDB és Node.js nélkül fut.

**Telepítés cPanelre:** [DEPLOY-CPANEL.md](DEPLOY-CPANEL.md).

- `backend-php/`: publikus és admin API, PDO/MySQL, készletfoglalási tranzakciók,
  SimplePay aláírás-ellenőrzés, tartós e-mail sor, helyi vagy S3/R2 képtár.
- `backend-php/database/schema.sql`, `seed.sql`: phpMyAdminból importálható séma és minták.
- `backend-php/bin/console.php`: séma, seed, MongoDB JSON import, e-mail worker.
- `frontend/`: eredeti felület; alapértelmezésben azonos domainen `/api`.
- `deploy/cpanel/`, `scripts/package-cpanel.mjs`: cPanel telepítési csomag.
- `.github/workflows/php-mysql.yml`: MySQL integrációs tesztek és letölthető build.

A publikus és admin végpontok megtartják a korábbi API útvonalait. A rendelés
nyilvános lekérdezése nem teszi elérhetővé a vevő személyes adatait.
A fizetést csak hiteles SimplePay IPN igazolhatja; törölt rendelés nem nyitható újra.

## Indítás fejlesztéshez

```sh
cp backend-php/config.example.php backend-php/config.local.php
# Töltsd ki a MySQL és PUBLIC_SITE_URL / CORS_ORIGINS beállításokat.
php backend-php/bin/console.php migrate
php backend-php/bin/console.php seed
php -S localhost:8001 backend-php/router.php
```

Másik terminálban:

```sh
cd frontend
corepack yarn install --frozen-lockfile
REACT_APP_BACKEND_URL=http://localhost:8001 corepack yarn start
```

Integrációs tesztek: külön `_test` végű adatbázisban, az Actions munkafolyamatban
felsorolt környezeti változókkal: `node backend-php/tests/integration.mjs`.

**Külső beállítás kell:** SimplePay kereskedői adatok és sandbox ellenőrzés,
e-mail API és percenkénti Cron. Az automatikus számlázó és csomagpont-integráció
az eredeti változatban sem volt bekötve; a részletes korlátok a telepítési útmutatóban.
Az új e-mail sablonok a meglévő eseményeket fedik le, magyar nyelven.

A korábbi Python kód referenciaként a `backend/` mappában maradt;
az új csomagnak nem része. Régi dokumentáció: [README-LEGACY-PYTHON.md](README-LEGACY-PYTHON.md).
