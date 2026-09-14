
CREATE TABLE IF NOT EXISTS coupons (code VARCHAR(40) COLLATE utf8mb4_bin PRIMARY KEY, document JSON NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS settings (`key` VARCHAR(80) PRIMARY KEY, document JSON NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS custom_requests (request_id VARCHAR(80) PRIMARY KEY, created_at VARCHAR(40) NOT NULL, document JSON NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS events (event_id VARCHAR(80) PRIMARY KEY, starts_at VARCHAR(40) NOT NULL, active TINYINT NOT NULL DEFAULT 1, document JSON NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS public_limits (ip_hash CHAR(64) PRIMARY KEY, attempts INT NOT NULL, window_start BIGINT NOT NULL) ENGINE=InnoDB;

SET NAMES utf8mb4;
START TRANSACTION;
INSERT INTO categories (name,sort_order,active,document) VALUES ('gyertyak',1,1,'{"name": "gyertyak", "name_hu": "Gyertyák", "name_en": "Candles", "order": 1, "active": true, "image": "https://images.unsplash.com/photo-1603905179139-db12ab535ca9", "description": "", "description_en": "", "tagline": "", "image_alt": "Gyertyák"}') ON DUPLICATE KEY UPDATE sort_order=VALUES(sort_order),active=1,document=VALUES(document);
INSERT INTO categories (name,sort_order,active,document) VALUES ('illatviasz',2,1,'{"name": "illatviasz", "name_hu": "Illatviasz", "name_en": "Wax melts", "order": 2, "active": true, "image": "", "description": "", "description_en": "", "tagline": "", "image_alt": "Illatviasz"}') ON DUPLICATE KEY UPDATE sort_order=VALUES(sort_order),active=1,document=VALUES(document);
INSERT INTO categories (name,sort_order,active,document) VALUES ('forma-gyertyak',3,1,'{"name": "forma-gyertyak", "name_hu": "Formagyertyák", "name_en": "Shaped candles", "order": 3, "active": true, "image": "", "description": "", "description_en": "", "tagline": "", "image_alt": "Formagyertyák"}') ON DUPLICATE KEY UPDATE sort_order=VALUES(sort_order),active=1,document=VALUES(document);
INSERT INTO categories (name,sort_order,active,document) VALUES ('asztali-disz',4,1,'{"name": "asztali-disz", "name_hu": "Asztali dísz", "name_en": "Table decorations", "order": 4, "active": true, "image": "", "description": "", "description_en": "", "tagline": "", "image_alt": "Asztali dísz"}') ON DUPLICATE KEY UPDATE sort_order=VALUES(sort_order),active=1,document=VALUES(document);
INSERT INTO categories (name,sort_order,active,document) VALUES ('egyeb',5,1,'{"name": "egyeb", "name_hu": "Egyéb", "name_en": "Other", "order": 5, "active": true, "image": "", "description": "", "description_en": "", "tagline": "", "image_alt": "Egyéb"}') ON DUPLICATE KEY UPDATE sort_order=VALUES(sort_order),active=1,document=VALUES(document);
UPDATE products SET category='forma-gyertyak',document=JSON_SET(document,'$.category','forma-gyertyak') WHERE category='Candles' AND JSON_UNQUOTE(JSON_EXTRACT(document,'$.subcategory'))='Pillar';
UPDATE products SET category='gyertyak',document=JSON_SET(document,'$.category','gyertyak') WHERE category='Candles';
UPDATE products SET status='archived',document=JSON_SET(document,'$.status','archived') WHERE category NOT IN ('gyertyak','illatviasz','forma-gyertyak','asztali-disz','egyeb');
UPDATE categories SET active=0,document=JSON_SET(document,'$.active',false) WHERE name NOT IN ('gyertyak','illatviasz','forma-gyertyak','asztali-disz','egyeb');
COMMIT;
