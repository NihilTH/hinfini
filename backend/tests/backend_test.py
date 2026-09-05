"""Backend tests for H'INFINI Candles"""
import os, io, json, base64, hmac, hashlib, time, uuid
import pytest
import requests
from PIL import Image

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://candle-craft-hub-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_TOKEN = "hinfini-admin-2026"
SP_KEY = "FxDa5w314kLlNseq2sKuVwaqZshZT5d6"
AH = {"X-Admin-Token": ADMIN_TOKEN}


def sp_sign(msg: str) -> str:
    return base64.b64encode(hmac.new(SP_KEY.encode(), msg.encode(), hashlib.sha384).digest()).decode()


# ---------- Public products / categories ----------
class TestProducts:
    def test_list_products_default(self):
        r = requests.get(f"{API}/products")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) > 0
        for p in data:
            assert p.get("status") not in ("draft", "hidden", "archived")
            assert "stock_state" in p and p["stock_state"] in ("in", "low", "out")

    def test_list_products_sort_price_asc(self):
        r = requests.get(f"{API}/products?sort=price_asc")
        assert r.status_code == 200
        prices = [p["price"] for p in r.json()]
        assert prices == sorted(prices)

    def test_list_products_sort_price_desc(self):
        r = requests.get(f"{API}/products?sort=price_desc")
        prices = [p["price"] for p in r.json()]
        assert prices == sorted(prices, reverse=True)

    def test_list_products_category_filter(self):
        r = requests.get(f"{API}/products?category=Candles")
        for p in r.json():
            assert p["category"] == "Candles"

    def test_list_products_featured(self):
        r = requests.get(f"{API}/products?featured=true")
        for p in r.json():
            assert p.get("featured") is True

    def test_list_products_search(self):
        r = requests.get(f"{API}/products?q=candle")
        assert r.status_code == 200

    def test_random_products(self):
        r = requests.get(f"{API}/products/random")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_product_detail_and_related(self):
        # take first published product
        p0 = requests.get(f"{API}/products").json()[0]
        r = requests.get(f"{API}/products/{p0['slug']}")
        assert r.status_code == 200
        p = r.json()
        assert p["slug"] == p0["slug"]
        assert "related" in p and isinstance(p["related"], list)
        assert len(p["related"]) <= 4
        for rel in p["related"]:
            assert rel["category"] == p["category"]
            assert rel["slug"] != p["slug"]

    def test_product_detail_404(self):
        r = requests.get(f"{API}/products/nonexistent-slug-xyz")
        assert r.status_code == 404


class TestCategories:
    def test_list_categories(self):
        r = requests.get(f"{API}/categories")
        assert r.status_code == 200
        cats = r.json()
        assert len(cats) > 0
        orders = [c.get("order", 0) for c in cats]
        assert orders == sorted(orders)
        for c in cats:
            assert "name_hu" in c and "name_en" in c and "count" in c


# ---------- Orders + payments ----------
class TestOrdersAndPayments:
    @pytest.fixture(scope="class")
    def sample_product(self):
        products = requests.get(f"{API}/products").json()
        # find in-stock product
        p = next((x for x in products if x.get("stock", 0) > 5), products[0])
        return p

    def _order_payload(self, product, qty=1, terms=True, newsletter=False):
        return {
            "items": [{"product_id": product["product_id"], "quantity": qty}],
            "full_name": "TEST User", "email": f"test_{uuid.uuid4().hex[:6]}@example.com",
            "phone": "+36301234567", "address": "TEST Street 1", "city": "Budapest",
            "postal_code": "1011", "country": "Magyarország",
            "shipping_method": "home", "accepted_terms": terms,
            "newsletter_opt_in": newsletter, "lang": "hu",
        }

    def test_order_requires_terms(self, sample_product):
        r = requests.post(f"{API}/orders", json=self._order_payload(sample_product, terms=False))
        assert r.status_code == 400
        assert "terms_required" in r.text

    def test_order_out_of_stock(self, sample_product):
        payload = self._order_payload(sample_product, qty=999999)
        r = requests.post(f"{API}/orders", json=payload)
        assert r.status_code == 400
        assert "out_of_stock" in r.text

    def test_order_create_and_stock_decrement(self, sample_product):
        stock_before = sample_product["stock"]
        payload = self._order_payload(sample_product, qty=1, newsletter=True)
        r = requests.post(f"{API}/orders", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "order_id" in data and data["status"] == "PENDING"
        # verify GET order
        oid = data["order_id"]
        g = requests.get(f"{API}/orders/{oid}")
        assert g.status_code == 200
        o = g.json()
        assert o["payment_status"] == "UNPAID"
        assert "ipn" not in o and "simplepay_response" not in o and "history" not in o and "admin_note" not in o
        # stock decrement check
        p2 = requests.get(f"{API}/products/{sample_product['slug']}").json()
        assert p2["stock"] == stock_before - 1
        # newsletter subscribed
        nl = requests.get(f"{API}/admin/newsletter", headers=AH).json()
        assert any(x["email"] == payload["email"].lower() for x in nl)
        # shipping calc
        subtotal = sample_product["price"]
        expected_ship = 0 if subtotal >= 25000 else 1990
        assert o["shipping"] == expected_ship
        assert o["total"] == subtotal + expected_ship
        # store for follow-up
        TestOrdersAndPayments.last_order_id = oid

    def test_payments_start(self):
        oid = TestOrdersAndPayments.last_order_id
        r = requests.post(f"{API}/payments/start", json={"order_id": oid, "return_origin": BASE_URL})
        assert r.status_code == 200, r.text
        data = r.json()
        # accept RESERVED if gateway unreachable, otherwise expect REDIRECTING
        if data.get("status") == "REDIRECTING":
            assert "sb-checkout.simplepay.hu" in data["paymentUrl"] or "sandbox" in data["paymentUrl"]
        else:
            pytest.skip(f"SimplePay unreachable/reserved: {data}")

    def test_ipn_invalid_signature(self):
        r = requests.post(f"{API}/payments/ipn", data='{"orderRef":"x","status":"FINISHED"}',
                          headers={"Content-Type": "application/json", "Signature": "invalid"})
        assert r.status_code == 400

    def test_ipn_valid_marks_paid(self):
        oid = TestOrdersAndPayments.last_order_id
        # Get order_ref from admin detail
        admin_o = requests.get(f"{API}/admin/orders/{oid}", headers=AH).json()
        order_ref = admin_o.get("order_ref") or f"{oid}-abc123"
        body = json.dumps({"orderRef": order_ref, "status": "FINISHED", "transactionId": 999999},
                          ensure_ascii=False, separators=(",", ":"))
        sig = sp_sign(body)
        r = requests.post(f"{API}/payments/ipn", data=body,
                          headers={"Content-Type": "application/json", "Signature": sig})
        assert r.status_code == 200, r.text
        assert "Signature" in {k.title(): v for k, v in r.headers.items()} or r.headers.get("Signature")
        # verify order
        o = requests.get(f"{API}/orders/{oid}").json()
        assert o["payment_status"] == "PAID"
        assert o["fulfillment_status"] == "PAID"
        # email logs
        logs = requests.get(f"{API}/admin/emails?order_id={oid}", headers=AH).json()
        events = {l["event"] for l in logs}
        assert "payment_success" in events
        assert "admin_paid" in events
        for l in logs:
            assert l["status"] == "SKIPPED"


# ---------- Newsletter ----------
class TestNewsletter:
    def test_subscribe_ok(self):
        email = f"test_nl_{uuid.uuid4().hex[:6]}@example.com"
        r = requests.post(f"{API}/newsletter/subscribe", json={"email": email, "consent": True, "lang": "hu"})
        assert r.status_code == 200
        assert r.json()["ok"] is True
        # duplicate
        r2 = requests.post(f"{API}/newsletter/subscribe", json={"email": email, "consent": True, "lang": "hu"})
        assert r2.json().get("already") is True

    def test_subscribe_no_consent(self):
        r = requests.post(f"{API}/newsletter/subscribe",
                          json={"email": "no_consent@example.com", "consent": False, "lang": "hu"})
        assert r.status_code == 400


# ---------- Admin auth ----------
class TestAdminAuth:
    def test_verify_correct(self):
        r = requests.post(f"{API}/admin/verify", headers=AH)
        assert r.status_code == 200
        assert r.json()["ok"] is True

    def test_verify_wrong(self):
        r = requests.post(f"{API}/admin/verify", headers={"X-Admin-Token": "wrong-token-once"})
        assert r.status_code == 401
        assert "Érvénytelen" in r.text or "rvénytelen" in r.text


# ---------- Admin: stats, products, categories, media, orders ----------
class TestAdminProducts:
    created_slug = None
    created_pid = None

    def test_stats(self):
        r = requests.get(f"{API}/admin/stats", headers=AH)
        assert r.status_code == 200
        d = r.json()
        for k in ("products", "orders_new", "low_stock", "subscribers", "email_provider", "storage", "payment_mode"):
            assert k in d

    def test_create_draft_not_public(self):
        slug = f"test-draft-{uuid.uuid4().hex[:6]}"
        payload = {"slug": slug, "name": "TEST Draft", "category": "Candles", "price": 1234,
                   "stock": 5, "status": "draft"}
        r = requests.post(f"{API}/admin/products", json=payload, headers=AH)
        assert r.status_code == 200, r.text
        data = r.json()
        TestAdminProducts.created_slug = slug
        TestAdminProducts.created_pid = data["product_id"]
        # not in public
        pub = requests.get(f"{API}/products").json()
        assert not any(p["slug"] == slug for p in pub)
        pub_detail = requests.get(f"{API}/products/{slug}")
        assert pub_detail.status_code == 404

    def test_duplicate_slug(self):
        payload = {"slug": TestAdminProducts.created_slug, "name": "dup", "category": "Candles", "price": 1000}
        r = requests.post(f"{API}/admin/products", json=payload, headers=AH)
        assert r.status_code == 400
        assert "slug_exists" in r.text

    def test_bulk_publish(self):
        r = requests.post(f"{API}/admin/products/bulk", json={
            "product_ids": [TestAdminProducts.created_pid], "action": "publish"
        }, headers=AH)
        assert r.status_code == 200
        pub = requests.get(f"{API}/products/{TestAdminProducts.created_slug}")
        assert pub.status_code == 200

    def test_bulk_hide(self):
        r = requests.post(f"{API}/admin/products/bulk", json={
            "product_ids": [TestAdminProducts.created_pid], "action": "hide"
        }, headers=AH)
        assert r.status_code == 200

    def test_archive(self):
        r = requests.post(f"{API}/admin/products/{TestAdminProducts.created_pid}/archive", headers=AH)
        assert r.status_code == 200


class TestAdminCategories:
    tmp = f"TEST_CAT_{uuid.uuid4().hex[:6]}"

    def test_create(self):
        r = requests.post(f"{API}/admin/categories", json={
            "name": self.tmp, "name_hu": "TesztKat", "name_en": "TestCat"
        }, headers=AH)
        assert r.status_code == 200

    def test_duplicate_name(self):
        r = requests.post(f"{API}/admin/categories", json={"name": self.tmp}, headers=AH)
        assert r.status_code == 400

    def test_reorder(self):
        r = requests.post(f"{API}/admin/categories/reorder", json={"names": [self.tmp]}, headers=AH)
        assert r.status_code == 200

    def test_delete_in_use(self):
        # Use Candles which has products
        r = requests.delete(f"{API}/admin/categories/Candles", headers=AH)
        assert r.status_code == 400
        assert "category_in_use" in r.text

    def test_delete_empty(self):
        r = requests.delete(f"{API}/admin/categories/{self.tmp}", headers=AH)
        assert r.status_code == 200


class TestAdminMedia:
    media_id = None

    def _png_bytes(self):
        img = Image.new("RGB", (10, 10), (200, 100, 50))
        buf = io.BytesIO(); img.save(buf, format="PNG"); return buf.getvalue()

    def test_upload_png(self):
        files = {"file": ("test.png", self._png_bytes(), "image/png")}
        r = requests.post(f"{API}/admin/media/upload", files=files, data={"alt": "TEST alt"}, headers=AH)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["url"].startswith("/api/uploads/") or "uploads" in d["url"]
        TestAdminMedia.media_id = d["media_id"]

    def test_upload_unsupported(self):
        files = {"file": ("bad.txt", b"hello", "text/plain")}
        r = requests.post(f"{API}/admin/media/upload", files=files, headers=AH)
        assert r.status_code == 400
        assert "unsupported_type" in r.text

    def test_patch_alt(self):
        r = requests.patch(f"{API}/admin/media/{TestAdminMedia.media_id}",
                           json={"alt": "new alt"}, headers=AH)
        assert r.status_code == 200

    def test_delete(self):
        r = requests.delete(f"{API}/admin/media/{TestAdminMedia.media_id}", headers=AH)
        assert r.status_code == 200


class TestAdminOrders:
    def test_list(self):
        r = requests.get(f"{API}/admin/orders", headers=AH)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_ship_and_cancel_flow(self):
        # Create fresh order
        prod = next(p for p in requests.get(f"{API}/products").json() if p.get("stock", 0) > 2)
        payload = {
            "items": [{"product_id": prod["product_id"], "quantity": 1}],
            "full_name": "TEST Ship", "email": f"ship_{uuid.uuid4().hex[:6]}@example.com",
            "address": "x", "city": "Budapest", "postal_code": "1011",
            "shipping_method": "home", "accepted_terms": True, "lang": "hu",
        }
        oid = requests.post(f"{API}/orders", json=payload).json()["order_id"]

        # ship
        r = requests.patch(f"{API}/admin/orders/{oid}/status", json={
            "fulfillment_status": "SHIPPED", "tracking_carrier": "GLS",
            "tracking_number": "TEST123", "tracking_url": "https://x", "tracking_eta": "2026-02-01"
        }, headers=AH)
        assert r.status_code == 200
        adm = requests.get(f"{API}/admin/orders/{oid}", headers=AH).json()
        assert adm["fulfillment_status"] == "SHIPPED"
        assert adm["tracking"]["number"] == "TEST123"
        events = {e["event"] for e in adm.get("emails", [])}
        assert "shipped" in events

        # invalid status
        rr = requests.patch(f"{API}/admin/orders/{oid}/status",
                            json={"fulfillment_status": "BOGUS"}, headers=AH)
        assert rr.status_code == 400

        # cancel restores stock
        stock_before = requests.get(f"{API}/products/{prod['slug']}").json()["stock"]
        rc = requests.patch(f"{API}/admin/orders/{oid}/status",
                            json={"fulfillment_status": "CANCELLED"}, headers=AH)
        assert rc.status_code == 200
        stock_after = requests.get(f"{API}/products/{prod['slug']}").json()["stock"]
        assert stock_after == stock_before + 1
        adm2 = requests.get(f"{API}/admin/orders/{oid}", headers=AH).json()
        events2 = {e["event"] for e in adm2.get("emails", [])}
        assert "cancelled" in events2 and "admin_cancel_request" in events2

    def test_invoice_patch(self):
        oid = requests.get(f"{API}/admin/orders", headers=AH).json()[0]["order_id"]
        r = requests.patch(f"{API}/admin/orders/{oid}/invoice",
                           json={"status": "ISSUED", "number": "INV-TEST", "url": "http://x"}, headers=AH)
        assert r.status_code == 200


class TestAdminEmailsAndNewsletter:
    def test_list_emails(self):
        r = requests.get(f"{API}/admin/emails", headers=AH)
        assert r.status_code == 200

    def test_resend_email(self):
        logs = requests.get(f"{API}/admin/emails", headers=AH).json()
        resendable = next((l for l in logs if l["event"] != "admin_low_stock"), None)
        if not resendable:
            pytest.skip("no resendable email log")
        r = requests.post(f"{API}/admin/emails/{resendable['log_id']}/resend", headers=AH)
        assert r.status_code == 200
        d = r.json()
        assert d.get("resend") is True or d.get("status") == "SKIPPED"

    def test_newsletter_list_and_delete(self):
        email = f"nl_del_{uuid.uuid4().hex[:6]}@example.com"
        requests.post(f"{API}/newsletter/subscribe",
                      json={"email": email, "consent": True, "lang": "hu"})
        r = requests.delete(f"{API}/admin/newsletter/{email}", headers=AH)
        assert r.status_code == 200
