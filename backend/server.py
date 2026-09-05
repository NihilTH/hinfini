from fastapi import FastAPI, APIRouter, HTTPException, Header, Request, Depends, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import logging, uuid, random, base64, hashlib, hmac, json, secrets, time
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import httpx

import config
import emailer
import invoicing
from storage import build_storage, make_key, StorageError

client = AsyncIOMotorClient(config.MONGO_URL)
db = client[config.DB_NAME]

app = FastAPI(title="H'INFINI Candles API")
api_router = APIRouter(prefix="/api")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

storage = build_storage()
if storage.driver == "local":
    app.mount("/api/uploads", StaticFiles(directory=str(config.UPLOAD_DIR)), name="uploads")

PUBLIC_FILTER = {"status": {"$nin": ["draft", "hidden", "archived"]}}
FULFILLMENT = ["NEW", "AWAITING_PAYMENT", "PAID", "PACKING", "SHIPPED", "COMPLETED", "CANCELLED"]
SP_FAILED = {"CANCELLED", "TIMEOUT", "NOTAUTHORIZED", "FAIL"}


def now_iso(): return datetime.now(timezone.utc).isoformat()


# =========== Admin auth (token in env only, basic brute-force protection) ===========
_fails: dict = {}


def _client_ip(request: Request) -> str:
    return (request.headers.get("x-forwarded-for") or request.client.host or "").split(",")[0].strip()


def require_admin(request: Request, x_admin_token: Optional[str] = Header(default=None)):
    ip = _client_ip(request)
    recent = [t for t in _fails.get(ip, []) if time.time() - t < 600]
    if len(recent) >= 8:
        raise HTTPException(429, "Túl sok sikertelen próbálkozás. Próbáld újra később.")
    if not config.ADMIN_TOKEN or not x_admin_token or not hmac.compare_digest(x_admin_token, config.ADMIN_TOKEN):
        recent.append(time.time()); _fails[ip] = recent
        raise HTTPException(401, "Érvénytelen hozzáférés.")
    _fails.pop(ip, None)
    return True


# =========== Models ===========
class ImageRef(BaseModel):
    url: str
    alt: str = ""


class ProductIn(BaseModel):
    slug: str
    name: str
    name_en: str = ""
    category: str
    subcategory: Optional[str] = None
    price: int
    unit: str = ""
    unit_en: str = ""
    image: str = ""
    image_alt: str = ""
    images: List[ImageRef] = []
    description: str = ""
    description_en: str = ""
    long_description: str = ""
    long_description_en: str = ""
    stock: int = 0
    featured: bool = False
    tags: List[str] = []
    status: str = "published"  # published | draft | hidden | archived


class CategoryIn(BaseModel):
    name: str
    name_hu: str = ""
    name_en: str = ""
    description: str = ""
    description_en: str = ""
    image: str = ""
    image_alt: str = ""
    tagline: str = ""
    order: int = 0
    active: bool = True


class CartItem(BaseModel):
    product_id: str
    quantity: int = Field(ge=1)


class CheckoutInput(BaseModel):
    items: List[CartItem]
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    address: str
    city: str
    postal_code: str
    country: str = "Magyarország"
    notes: Optional[str] = None
    shipping_method: str = "home"  # home | pickup
    accepted_terms: bool
    newsletter_opt_in: bool = False
    lang: str = "hu"


class BulkAction(BaseModel):
    product_ids: List[str]
    action: str  # publish | hide | archive | set_category
    category: Optional[str] = None


class OrderStatusIn(BaseModel):
    fulfillment_status: str
    tracking_carrier: Optional[str] = None
    tracking_number: Optional[str] = None
    tracking_url: Optional[str] = None
    tracking_eta: Optional[str] = None
    admin_note: Optional[str] = None


class InvoiceIn(BaseModel):
    status: str
    number: Optional[str] = None
    url: Optional[str] = None


class NewsletterIn(BaseModel):
    email: EmailStr
    consent: bool
    lang: str = "hu"
    source: str = "footer"


class MediaPatch(BaseModel):
    alt: str = ""


class CategoryOrderIn(BaseModel):
    names: List[str]


def shipping_fee(subtotal: int, method: str) -> int:
    if subtotal >= config.FREE_SHIPPING_FROM: return 0
    return config.SHIPPING_FEE_PICKUP if method == "pickup" else config.SHIPPING_FEE_HOME


def stock_state(stock: int) -> str:
    if stock <= 0: return "out"
    if stock <= config.LOW_STOCK_THRESHOLD: return "low"
    return "in"


def public_product(p: dict) -> dict:
    p["stock_state"] = stock_state(int(p.get("stock", 0)))
    return p


# =========== Public: products & categories ===========
@api_router.get("/config")
async def public_config():
    return {"free_shipping_from": config.FREE_SHIPPING_FROM, "shipping_home": config.SHIPPING_FEE_HOME,
            "shipping_pickup": config.SHIPPING_FEE_PICKUP, "payment_mode": "sandbox" if "sandbox" in config.SP_BASE else "live",
            "support_email": config.SUPPORT_EMAIL}


@api_router.get("/products")
async def list_products(category: Optional[str] = None, q: Optional[str] = None, featured: Optional[bool] = None, sort: str = "recommended"):
    query: dict = dict(PUBLIC_FILTER)
    if category: query["category"] = category
    if featured is not None: query["featured"] = featured
    if q:
        query["$or"] = [{"name": {"$regex": q, "$options": "i"}}, {"name_en": {"$regex": q, "$options": "i"}},
                        {"description": {"$regex": q, "$options": "i"}}, {"tags": {"$regex": q, "$options": "i"}}]
    items = await db.products.find(query, {"_id": 0}).to_list(1000)
    if sort == "price_asc": items.sort(key=lambda p: p["price"])
    elif sort == "price_desc": items.sort(key=lambda p: -p["price"])
    elif sort == "newest": items.sort(key=lambda p: p.get("created_at", ""), reverse=True)
    else: items.sort(key=lambda p: (not p.get("featured", False), p.get("stock", 0) <= 0))
    return [public_product(p) for p in items]


@api_router.get("/products/random")
async def random_products(limit: int = 100):
    items = await db.products.find(PUBLIC_FILTER, {"_id": 0}).to_list(1000)
    random.shuffle(items)
    return [public_product(p) for p in items[:limit]]


@api_router.get("/products/{slug}")
async def get_product(slug: str):
    p = await db.products.find_one({"slug": slug, **PUBLIC_FILTER}, {"_id": 0})
    if not p: raise HTTPException(404, "Not found")
    related = await db.products.find({"category": p["category"], "slug": {"$ne": slug}, **PUBLIC_FILTER}, {"_id": 0}).to_list(50)
    random.shuffle(related)
    p = public_product(p)
    p["related"] = [public_product(r) for r in related[:4]]
    return p


@api_router.get("/categories")
async def categories():
    cats = await db.categories.find({"active": {"$ne": False}}, {"_id": 0}).sort("order", 1).to_list(200)
    for c in cats:
        c["count"] = await db.products.count_documents({"category": c["name"], **PUBLIC_FILTER})
    return cats


# =========== Public: guides ===========
@api_router.get("/guides")
async def list_guides():
    return await db.guides.find({}, {"_id": 0, "sections": 0}).to_list(200)


@api_router.get("/guides/{slug}")
async def get_guide(slug: str):
    g = await db.guides.find_one({"slug": slug}, {"_id": 0})
    if not g: raise HTTPException(404, "Not found")
    return g


# =========== Public: newsletter ===========
@api_router.post("/newsletter/subscribe")
async def newsletter_subscribe(payload: NewsletterIn):
    if not payload.consent: raise HTTPException(400, "consent_required")
    email = payload.email.lower()
    existing = await db.newsletter.find_one({"email": email})
    if existing: return {"ok": True, "already": True}
    await db.newsletter.insert_one({"email": email, "consent": True, "consented_at": now_iso(), "lang": payload.lang, "source": payload.source})
    return {"ok": True, "already": False}


# =========== Public: orders ===========
@api_router.post("/orders")
async def create_order(payload: CheckoutInput):
    if not payload.items: raise HTTPException(400, "cart_empty")
    if not payload.accepted_terms: raise HTTPException(400, "terms_required")
    if payload.shipping_method not in ("home", "pickup"): raise HTTPException(400, "invalid_shipping")
    line_items, subtotal = [], 0
    for ci in payload.items:
        p = await db.products.find_one({"product_id": ci.product_id, **PUBLIC_FILTER}, {"_id": 0})
        if not p: raise HTTPException(400, f"unavailable:{ci.product_id}")
        if int(p.get("stock", 0)) < ci.quantity: raise HTTPException(400, f"out_of_stock:{p['name']}")
        line_total = int(p["price"]) * ci.quantity
        subtotal += line_total
        line_items.append({"product_id": p["product_id"], "slug": p["slug"], "name": p["name"], "name_en": p.get("name_en", ""),
                           "price": p["price"], "image": p.get("image", ""), "quantity": ci.quantity, "line_total": line_total})
    shipping = shipping_fee(subtotal, payload.shipping_method)
    reserved = []
    for li in line_items:
        r = await db.products.update_one({"product_id": li["product_id"], "stock": {"$gte": li["quantity"]}}, {"$inc": {"stock": -li["quantity"]}})
        if r.matched_count == 0:
            for done in reserved:
                await db.products.update_one({"product_id": done["product_id"]}, {"$inc": {"stock": done["quantity"]}})
            raise HTTPException(400, f"out_of_stock:{li['name']}")
        reserved.append(li)
    order_id = f"ord_{uuid.uuid4().hex[:10]}"
    doc = {
        "order_id": order_id, "email": payload.email.lower(), "full_name": payload.full_name, "phone": payload.phone,
        "items": line_items, "subtotal": subtotal, "shipping": shipping, "total": subtotal + shipping,
        "address": payload.address, "city": payload.city, "postal_code": payload.postal_code, "country": payload.country,
        "notes": payload.notes, "shipping_method": payload.shipping_method, "accepted_terms_at": now_iso(),
        "newsletter_opt_in": payload.newsletter_opt_in, "lang": payload.lang,
        "status": "PENDING", "payment_status": "UNPAID", "fulfillment_status": "AWAITING_PAYMENT",
        "invoice": {"status": "NONE"}, "history": [{"at": now_iso(), "event": "created"}], "created_at": now_iso(),
    }
    await db.orders.insert_one(doc)
    doc.pop("_id", None)
    low = []
    for li in line_items:
        p = await db.products.find_one({"product_id": li["product_id"]}, {"_id": 0})
        if p and int(p.get("stock", 0)) <= config.LOW_STOCK_THRESHOLD: low.append(p)
    if payload.newsletter_opt_in and not await db.newsletter.find_one({"email": doc["email"]}):
        await db.newsletter.insert_one({"email": doc["email"], "consent": True, "consented_at": now_iso(), "lang": payload.lang, "source": "checkout"})
    emailer.fire(emailer.send_event(db, "order_created", doc))
    emailer.fire(emailer.send_event(db, "admin_new_order", doc))
    for p in low:
        emailer.fire(emailer.send_event(db, "admin_low_stock", p, idem_suffix=f":{p.get('stock', 0)}"))
    return {"order_id": order_id, "total": doc["total"], "status": "PENDING"}


@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    o = await db.orders.find_one({"order_id": order_id}, {"_id": 0, "ipn": 0, "simplepay_response": 0, "history": 0, "admin_note": 0})
    if not o: raise HTTPException(404, "Not found")
    return o


# =========== SimplePay ===========
def _sp_json(v): return json.dumps(v, ensure_ascii=False, separators=(",", ":"))


def _sp_sign(msg: str) -> str:
    return base64.b64encode(hmac.new(config.SP_KEY.encode(), msg.encode(), hashlib.sha384).digest()).decode()


def _sp_valid(msg: str, sig: str) -> bool:
    return hmac.compare_digest(_sp_sign(msg), sig or "")


async def apply_payment_result(order: dict, sp_status: str, source: str, extra: Optional[dict] = None):
    oid = order["order_id"]
    upd = {"status": sp_status, "history": order.get("history", []) + [{"at": now_iso(), "event": f"{source}:{sp_status}"}]}
    if extra: upd.update(extra)
    if sp_status == "FINISHED":
        upd["payment_status"] = "PAID"; upd["paid_at"] = now_iso()
        if order.get("fulfillment_status") in ("NEW", "AWAITING_PAYMENT"): upd["fulfillment_status"] = "PAID"
    elif sp_status in SP_FAILED:
        upd["payment_status"] = "FAILED"
    await db.orders.update_one({"order_id": oid}, {"$set": upd})
    fresh = await db.orders.find_one({"order_id": oid}, {"_id": 0})
    if sp_status == "FINISHED":
        emailer.fire(emailer.send_event(db, "payment_success", fresh))
        emailer.fire(emailer.send_event(db, "admin_paid", fresh))
        emailer.fire(invoicing.maybe_issue(db, fresh, "paid"))
    elif sp_status in SP_FAILED:
        emailer.fire(emailer.send_event(db, "payment_failed", fresh))
        emailer.fire(emailer.send_event(db, "admin_payment_failed", fresh))
    return fresh


@api_router.post("/payments/start")
async def payments_start(request: Request):
    body = await request.json()
    order_id = body.get("order_id")
    return_origin = (body.get("return_origin") or config.PUBLIC_SITE_URL).rstrip("/")
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order: raise HTTPException(404, "Order not found")
    if order.get("payment_status") == "PAID": return {"paymentUrl": None, "status": "PAID", "order_id": order_id}
    order_ref = f"{order_id}-{secrets.token_hex(3)}"
    payload = {
        "salt": secrets.token_hex(16), "merchant": config.SP_MID, "orderRef": order_ref,
        "customer": order["full_name"], "customerEmail": order["email"], "language": "HU" if order.get("lang", "hu") == "hu" else "EN",
        "currency": "HUF", "total": int(order["total"]), "methods": ["CARD"],
        "timeout": (datetime.now(timezone.utc) + timedelta(minutes=15)).replace(microsecond=0).isoformat(),
        "url": f"{return_origin}/order/{order_id}", "sdkVersion": "SimplePayV2.1_Payment_Python_Custom",
        "invoice": {"name": order["full_name"], "country": "HU", "state": "", "city": order["city"], "zip": order["postal_code"], "address": order["address"]},
    }
    msg = _sp_json(payload)
    try:
        async with httpx.AsyncClient(timeout=15) as http:
            r = await http.post(f"{config.SP_BASE}/start", content=msg.encode(), headers={"Content-Type": "application/json", "Signature": _sp_sign(msg)})
        data = r.json()
    except Exception as e:
        logger.error(f"SimplePay start failed: {e}")
        await db.orders.update_one({"order_id": order_id}, {"$set": {"status": "RESERVED", "payment_status": "RESERVED", "payment_error": str(e)[:200]}})
        return {"paymentUrl": None, "status": "RESERVED", "message": "gateway_unreachable"}
    if not data.get("paymentUrl"):
        await db.orders.update_one({"order_id": order_id}, {"$set": {"status": "RESERVED", "payment_status": "RESERVED", "simplepay_response": data}})
        return {"paymentUrl": None, "status": "RESERVED", "message": data.get("errorCodes") or "start_failed"}
    await db.orders.update_one({"order_id": order_id}, {"$set": {"transaction_id": data.get("transactionId"), "order_ref": order_ref, "simplepay_response": data}})
    return {"paymentUrl": data["paymentUrl"], "status": "REDIRECTING", "order_id": order_id}


@api_router.post("/payments/return")
async def payments_return(request: Request):
    """Verifies the signed browser back-redirect. Informational only — never marks an order as paid."""
    body = await request.json()
    r, s = body.get("r") or "", body.get("s") or ""
    try:
        raw = base64.b64decode(r).decode()
    except Exception:
        raise HTTPException(400, "invalid_return")
    if not _sp_valid(raw, s): raise HTTPException(400, "invalid_signature")
    data = json.loads(raw)
    oid = (data.get("o") or "").split("-")[0]
    order = await db.orders.find_one({"order_id": oid}, {"_id": 0})
    if order:
        await db.orders.update_one({"order_id": oid}, {"$set": {"return_event": data.get("e"), "return_at": now_iso()}})
    return {"event": data.get("e"), "order_id": oid, "transaction_id": data.get("t")}


@api_router.post("/payments/ipn")
async def payments_ipn(request: Request):
    raw = (await request.body()).decode()
    sig = request.headers.get("Signature")
    if not sig or not _sp_valid(raw, sig): raise HTTPException(400, "Invalid IPN signature")
    msg = json.loads(raw)
    order_ref, status = msg.get("orderRef"), msg.get("status")
    if order_ref and status:
        order = await db.orders.find_one({"order_id": order_ref.split("-")[0]}, {"_id": 0})
        if order and order.get("status") != status:
            await apply_payment_result(order, status, "ipn", {"ipn": msg, "transaction_id": msg.get("transactionId") or order.get("transaction_id")})
    ack = dict(msg); ack["receiveDate"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S%z")
    body = _sp_json(ack)
    return JSONResponse(content=json.loads(body), headers={"Signature": _sp_sign(body)})


# =========== Admin ===========
admin = APIRouter(prefix="/admin", dependencies=[Depends(require_admin)])


@admin.post("/verify")
async def admin_verify():
    return {"ok": True}


@admin.get("/stats")
async def admin_stats():
    return {
        "products": await db.products.count_documents({"status": {"$ne": "archived"}}),
        "orders_new": await db.orders.count_documents({"fulfillment_status": {"$in": ["NEW", "AWAITING_PAYMENT", "PAID"]}}),
        "low_stock": await db.products.count_documents({"stock": {"$lte": config.LOW_STOCK_THRESHOLD}, "status": {"$ne": "archived"}}),
        "subscribers": await db.newsletter.count_documents({}),
        "email_provider": config.EMAIL_PROVIDER, "storage": storage.driver, "payment_mode": "sandbox" if "sandbox" in config.SP_BASE else "live",
    }


# --- products ---
@admin.get("/products")
async def admin_products(include_archived: bool = False):
    q = {} if include_archived else {"status": {"$ne": "archived"}}
    items = await db.products.find(q, {"_id": 0}).to_list(2000)
    return [public_product(p) for p in items]


@admin.post("/products")
async def admin_create_product(payload: ProductIn):
    if await db.products.find_one({"slug": payload.slug}): raise HTTPException(400, "slug_exists")
    doc = payload.model_dump()
    doc["product_id"] = f"prd_{uuid.uuid4().hex[:10]}"
    doc["created_at"] = now_iso(); doc["updated_at"] = now_iso()
    await db.products.insert_one(doc)
    doc.pop("_id", None)
    return doc


@admin.put("/products/{product_id}")
async def admin_update_product(product_id: str, payload: ProductIn):
    dup = await db.products.find_one({"slug": payload.slug, "product_id": {"$ne": product_id}})
    if dup: raise HTTPException(400, "slug_exists")
    upd = payload.model_dump(); upd["updated_at"] = now_iso()
    r = await db.products.update_one({"product_id": product_id}, {"$set": upd})
    if r.matched_count == 0: raise HTTPException(404, "Not found")
    return {"ok": True}


@admin.post("/products/{product_id}/archive")
async def admin_archive_product(product_id: str):
    r = await db.products.update_one({"product_id": product_id}, {"$set": {"status": "archived", "updated_at": now_iso()}})
    if r.matched_count == 0: raise HTTPException(404, "Not found")
    return {"ok": True}


@admin.post("/products/bulk")
async def admin_bulk(payload: BulkAction):
    q = {"product_id": {"$in": payload.product_ids}}
    if payload.action == "set_category":
        if not payload.category: raise HTTPException(400, "category_required")
        upd = {"category": payload.category}
    elif payload.action in ("publish", "hide", "archive"):
        upd = {"status": {"publish": "published", "hide": "hidden", "archive": "archived"}[payload.action]}
    else:
        raise HTTPException(400, "invalid_action")
    upd["updated_at"] = now_iso()
    r = await db.products.update_many(q, {"$set": upd})
    return {"ok": True, "modified": r.modified_count}


# --- categories ---
@admin.get("/categories")
async def admin_categories():
    cats = await db.categories.find({}, {"_id": 0}).sort("order", 1).to_list(200)
    for c in cats:
        c["count"] = await db.products.count_documents({"category": c["name"], "status": {"$ne": "archived"}})
    return cats


@admin.post("/categories")
async def admin_create_category(payload: CategoryIn):
    if await db.categories.find_one({"name": payload.name}): raise HTTPException(400, "category_exists")
    doc = payload.model_dump()
    if doc["order"] == 0: doc["order"] = await db.categories.count_documents({}) + 1
    await db.categories.insert_one(doc)
    doc.pop("_id", None)
    return {**doc, "count": 0}


@admin.put("/categories/{name}")
async def admin_update_category(name: str, payload: CategoryIn):
    r = await db.categories.update_one({"name": name}, {"$set": payload.model_dump()})
    if r.matched_count == 0: raise HTTPException(404, "Not found")
    if payload.name != name:
        await db.products.update_many({"category": name}, {"$set": {"category": payload.name}})
    return {"ok": True}


@admin.post("/categories/reorder")
async def admin_reorder_categories(payload: CategoryOrderIn):
    for i, n in enumerate(payload.names):
        await db.categories.update_one({"name": n}, {"$set": {"order": i + 1}})
    return {"ok": True}


@admin.delete("/categories/{name}")
async def admin_delete_category(name: str):
    count = await db.products.count_documents({"category": name})
    if count > 0: raise HTTPException(400, f"category_in_use:{count}")
    await db.categories.delete_one({"name": name})
    return {"ok": True}


# --- media ---
@admin.get("/media")
async def admin_media():
    return await db.media.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)


@admin.post("/media/upload")
async def admin_media_upload(file: UploadFile = File(...), alt: str = Form("")):
    ext = config.ALLOWED_IMAGE_TYPES.get(file.content_type or "")
    if not ext: raise HTTPException(400, "unsupported_type")
    content = await file.read()
    if len(content) > config.MAX_UPLOAD_MB * 1024 * 1024: raise HTTPException(400, f"file_too_large:{config.MAX_UPLOAD_MB}")
    key = make_key(ext)
    try:
        url = await storage.save(key, content, file.content_type)
    except Exception as e:
        logger.error(f"upload failed: {e}"); raise HTTPException(500, "storage_error")
    doc = {"media_id": f"med_{uuid.uuid4().hex[:10]}", "url": url, "key": key, "filename": file.filename, "content_type": file.content_type,
           "size": len(content), "alt": alt, "driver": storage.driver, "created_at": now_iso()}
    await db.media.insert_one(doc)
    doc.pop("_id", None)
    return doc


@admin.patch("/media/{media_id}")
async def admin_media_patch(media_id: str, payload: MediaPatch):
    r = await db.media.update_one({"media_id": media_id}, {"$set": {"alt": payload.alt}})
    if r.matched_count == 0: raise HTTPException(404, "Not found")
    return {"ok": True}


@admin.delete("/media/{media_id}")
async def admin_media_delete(media_id: str):
    m = await db.media.find_one({"media_id": media_id}, {"_id": 0})
    if not m: raise HTTPException(404, "Not found")
    in_use = await db.products.count_documents({"$or": [{"image": m["url"]}, {"images.url": m["url"]}]}) + await db.categories.count_documents({"image": m["url"]})
    if in_use: raise HTTPException(400, f"media_in_use:{in_use}")
    try: await storage.delete(m["key"])
    except Exception as e: logger.warning(f"storage delete failed: {e}")
    await db.media.delete_one({"media_id": media_id})
    return {"ok": True}


# --- orders ---
@admin.get("/orders")
async def admin_orders(q: Optional[str] = None, status: Optional[str] = None):
    query: dict = {}
    if status: query["fulfillment_status"] = status
    if q: query["$or"] = [{"order_id": {"$regex": q, "$options": "i"}}, {"full_name": {"$regex": q, "$options": "i"}}, {"email": {"$regex": q, "$options": "i"}}]
    return await db.orders.find(query, {"_id": 0, "ipn": 0, "simplepay_response": 0}).sort("created_at", -1).to_list(2000)


@admin.get("/orders/{order_id}")
async def admin_order(order_id: str):
    o = await db.orders.find_one({"order_id": order_id}, {"_id": 0, "ipn": 0, "simplepay_response": 0})
    if not o: raise HTTPException(404, "Not found")
    o["emails"] = await db.email_logs.find({"order_id": order_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return o


@admin.patch("/orders/{order_id}/status")
async def admin_order_status(order_id: str, payload: OrderStatusIn):
    if payload.fulfillment_status not in FULFILLMENT: raise HTTPException(400, "invalid_status")
    o = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not o: raise HTTPException(404, "Not found")
    prev = o.get("fulfillment_status")
    upd = {"fulfillment_status": payload.fulfillment_status, "updated_at": now_iso(),
           "history": o.get("history", []) + [{"at": now_iso(), "event": f"admin:{prev}->{payload.fulfillment_status}"}]}
    if payload.admin_note is not None: upd["admin_note"] = payload.admin_note
    if payload.fulfillment_status == "SHIPPED":
        upd["tracking"] = {"carrier": payload.tracking_carrier, "number": payload.tracking_number, "url": payload.tracking_url, "eta": payload.tracking_eta}
        upd["shipped_at"] = now_iso()
    if payload.fulfillment_status == "CANCELLED" and prev != "CANCELLED":
        for li in o["items"]:
            await db.products.update_one({"product_id": li["product_id"]}, {"$inc": {"stock": li["quantity"]}})
    await db.orders.update_one({"order_id": order_id}, {"$set": upd})
    fresh = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if payload.fulfillment_status == "SHIPPED" and prev != "SHIPPED": emailer.fire(emailer.send_event(db, "shipped", fresh))
    if payload.fulfillment_status == "CANCELLED" and prev != "CANCELLED":
        emailer.fire(emailer.send_event(db, "cancelled", fresh)); emailer.fire(emailer.send_event(db, "admin_cancel_request", fresh))
    if payload.fulfillment_status == "COMPLETED": emailer.fire(invoicing.maybe_issue(db, fresh, "fulfilled"))
    return {"ok": True}


@admin.patch("/orders/{order_id}/invoice")
async def admin_order_invoice(order_id: str, payload: InvoiceIn):
    r = await db.orders.update_one({"order_id": order_id}, {"$set": {"invoice": {"status": payload.status, "number": payload.number, "url": payload.url, "provider": "manual", "issued_at": now_iso()}}})
    if r.matched_count == 0: raise HTTPException(404, "Not found")
    return {"ok": True}


# --- newsletter & email log ---
@admin.get("/newsletter")
async def admin_newsletter():
    return await db.newsletter.find({}, {"_id": 0}).sort("consented_at", -1).to_list(5000)


@admin.delete("/newsletter/{email}")
async def admin_newsletter_delete(email: str):
    await db.newsletter.delete_one({"email": email.lower()})
    return {"ok": True}


@admin.get("/emails")
async def admin_emails(order_id: Optional[str] = None):
    q = {"order_id": order_id} if order_id else {}
    return await db.email_logs.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)


@admin.post("/emails/{log_id}/resend")
async def admin_email_resend(log_id: str):
    log = await db.email_logs.find_one({"log_id": log_id}, {"_id": 0})
    if not log: raise HTTPException(404, "Not found")
    if log["event"] == "admin_low_stock": raise HTTPException(400, "not_resendable")
    order = await db.orders.find_one({"order_id": log["order_id"]}, {"_id": 0})
    if not order: raise HTTPException(404, "order_not_found")
    res = await emailer.send_event(db, log["event"], order, to=log["recipient"], force=True)
    return res or {"ok": False}


api_router.include_router(admin)


# =========== Seed & migration ===========
from seed_data import PRODUCTS_SEED, GUIDES_SEED, CATEGORIES_SEED

CAT_HU = {"Candles": "Gyertyák", "Wax": "Viaszok", "Fragrance Oils": "Illatolajok", "Essential Oils": "Illóolajok",
          "Wicks": "Kanócok", "Containers": "Edények", "Tools": "Eszközök", "Kits": "Kezdő szettek"}


@app.on_event("startup")
async def seed():
    if await db.products.count_documents({}) == 0:
        await db.products.insert_many([{**p, "created_at": now_iso()} for p in PRODUCTS_SEED])
    if await db.guides.count_documents({}) == 0:
        await db.guides.insert_many([dict(g) for g in GUIDES_SEED])
    if await db.categories.count_documents({}) == 0:
        await db.categories.insert_many([dict(c) for c in CATEGORIES_SEED])
    # migrations for legacy documents
    await db.products.update_many({"status": {"$exists": False}}, {"$set": {"status": "published"}})
    await db.products.update_many({"created_at": {"$exists": False}}, {"$set": {"created_at": now_iso()}})
    await db.products.update_many({"images": {"$exists": False}}, {"$set": {"images": [], "image_alt": "", "name_en": "", "description_en": "", "long_description_en": "", "unit_en": ""}})
    cats = await db.categories.find({}, {"_id": 0}).to_list(200)
    for i, c in enumerate(cats):
        upd = {}
        if "order" not in c: upd["order"] = i + 1
        if "active" not in c: upd["active"] = True
        if not c.get("name_hu"): upd["name_hu"] = CAT_HU.get(c["name"], c["name"])
        if not c.get("name_en"): upd["name_en"] = c["name"]
        for k in ("description", "description_en", "image_alt"):
            if k not in c: upd[k] = ""
        if upd: await db.categories.update_one({"name": c["name"]}, {"$set": upd})
    await db.orders.update_many({"payment_status": {"$exists": False}}, {"$set": {"payment_status": "UNPAID", "fulfillment_status": "AWAITING_PAYMENT", "shipping_method": "home"}})
    await db.email_logs.create_index("idempotency_key")
    await db.orders.create_index("order_id", unique=True)
    await db.products.create_index("slug", unique=True)
    if not config.ADMIN_TOKEN: logger.warning("ADMIN_TOKEN is not set — admin API is disabled.")


@api_router.get("/")
async def root():
    return {"message": "H'INFINI Candles API", "status": "ok"}


app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=config.CORS_ORIGINS.split(','), allow_methods=["*"], allow_headers=["*"])


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
