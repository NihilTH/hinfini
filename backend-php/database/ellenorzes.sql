-- Csak olvas: phpMyAdminban előbb válaszd ki a webshop adatbázisát.
SELECT DATABASE() AS aktualis_adatbazis;
SELECT status AS allapot, COUNT(*) AS termekek_szama FROM products GROUP BY status;
SELECT name AS kategoria, active AS aktiv FROM categories ORDER BY sort_order;
SELECT product_id, JSON_UNQUOTE(JSON_EXTRACT(document,'$.name')) AS nev, category, status, stock FROM products ORDER BY category, product_id;
