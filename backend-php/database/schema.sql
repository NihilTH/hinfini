-- MySQL 8.0+ / MariaDB 10.6+. Import into an empty database selected in phpMyAdmin.
CREATE TABLE IF NOT EXISTS categories (
 name VARCHAR(191) COLLATE utf8mb4_bin PRIMARY KEY, sort_order INT NOT NULL DEFAULT 0,
 active TINYINT NOT NULL DEFAULT 1, document JSON NOT NULL,
 INDEX category_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS products (
 product_id VARCHAR(80) COLLATE utf8mb4_bin PRIMARY KEY,
 slug VARCHAR(191) COLLATE utf8mb4_bin NOT NULL UNIQUE,
 category VARCHAR(191) COLLATE utf8mb4_bin NOT NULL,
 price BIGINT UNSIGNED NOT NULL, stock INT UNSIGNED NOT NULL,
 status VARCHAR(20) NOT NULL, featured TINYINT NOT NULL DEFAULT 0, document JSON NOT NULL,
 INDEX catalog (status,category), INDEX price_sort (price),
 CONSTRAINT product_category FOREIGN KEY (category) REFERENCES categories(name) ON UPDATE CASCADE,
 CONSTRAINT product_status CHECK (status IN ('published','draft','hidden','archived'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS guides (slug VARCHAR(191) COLLATE utf8mb4_bin PRIMARY KEY, document JSON NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS orders (
 order_id VARCHAR(80) COLLATE utf8mb4_bin PRIMARY KEY, payment_status VARCHAR(20) NOT NULL,
 fulfillment_status VARCHAR(30) NOT NULL, total BIGINT UNSIGNED NOT NULL,
 created_at VARCHAR(40) NOT NULL, document JSON NOT NULL,
 INDEX order_status (fulfillment_status,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS payment_attempts (
 order_ref VARCHAR(120) COLLATE utf8mb4_bin PRIMARY KEY, order_id VARCHAR(80) COLLATE utf8mb4_bin NOT NULL,
 transaction_id VARCHAR(80) NULL, state VARCHAR(30) NOT NULL DEFAULT 'STARTING',
 payment_url TEXT NULL, expires_at BIGINT NOT NULL, created_at VARCHAR(40) NOT NULL,
 FOREIGN KEY (order_id) REFERENCES orders(order_id), INDEX attempts_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS media (media_id VARCHAR(80) COLLATE utf8mb4_bin PRIMARY KEY, document JSON NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS newsletter (email VARCHAR(254) PRIMARY KEY, document JSON NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS email_logs (
 log_id VARCHAR(80) COLLATE utf8mb4_bin PRIMARY KEY, order_id VARCHAR(80) NULL,
 idempotency_key VARCHAR(64) NOT NULL UNIQUE, status VARCHAR(20) NOT NULL,
 created_at VARCHAR(40) NOT NULL, document JSON NOT NULL, INDEX order_emails (order_id,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS auth_attempts (ip_hash CHAR(64) PRIMARY KEY, failures INT NOT NULL, window_start BIGINT NOT NULL) ENGINE=InnoDB;
