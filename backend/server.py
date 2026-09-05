from fastapi import FastAPI, APIRouter, HTTPException, Header, Request
from fastapi.responses import RedirectResponse, JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, uuid, random, base64, hashlib, hmac, json, secrets
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]

ADMIN_TOKEN = os.environ.get('ADMIN_TOKEN', 'admin-dev')
SP_MID = os.environ.get('SIMPLEPAY_MERCHANT_ID', 'PUBLICTESTHUF')
SP_KEY = os.environ.get('SIMPLEPAY_SECRET_KEY', '')
SP_BASE = os.environ.get('SIMPLEPAY_BASE_URL', 'https://sandbox.simplepay.hu/payment/v2')

app = FastAPI(title="H'INFINI Candles API")
api_router = APIRouter(prefix="/api")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def require_admin(x_admin_token: Optional[str] = Header(default=None)):
    if x_admin_token != ADMIN_TOKEN:
        raise HTTPException(401, "Admin token required")
    return True


# =========== Models ===========
class ProductIn(BaseModel):
    slug: str
    name: str
    category: str
    subcategory: Optional[str] = None
    price: int  # HUF integer
    unit: str
    image: str
    description: str
    long_description: Optional[str] = None
    stock: int = 100
    featured: bool = False
    tags: List[str] = []


class CategoryIn(BaseModel):
    name: str
    image: Optional[str] = None
    tagline: Optional[str] = None


class CartItem(BaseModel):
    product_id: str
    quantity: int


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


# =========== Products ===========
@api_router.get("/products")
async def list_products(category: Optional[str] = None, q: Optional[str] = None, featured: Optional[bool] = None):
    query: dict = {}
    if category: query["category"] = category
    if featured is not None: query["featured"] = featured
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"tags": {"$regex": q, "$options": "i"}},
        ]
    return await db.products.find(query, {"_id": 0}).to_list(500)


@api_router.get("/products/random")
async def random_products(limit: int = 24):
    items = await db.products.find({}, {"_id": 0}).to_list(500)
    random.shuffle(items)
    return items[:limit]


@api_router.get("/products/{slug}")
async def get_product(slug: str):
    p = await db.products.find_one({"slug": slug}, {"_id": 0})
    if not p: raise HTTPException(404, "Not found")
    return p


@api_router.get("/categories")
async def categories():
    cats = await db.categories.find({}, {"_id": 0}).to_list(200)
    result = []
    for c in cats:
        count = await db.products.count_documents({"category": c["name"]})
        c["count"] = count
        result.append(c)
    return result


# =========== Admin CRUD ===========
@api_router.post("/admin/verify")
async def admin_verify(_: bool = __import__('fastapi').Depends(require_admin)):
    return {"ok": True}


@api_router.post("/admin/categories")
async def admin_create_category(payload: CategoryIn, _: bool = __import__('fastapi').Depends(require_admin)):
    existing = await db.categories.find_one({"name": payload.name})
    if existing: raise HTTPException(400, "Category exists")
    doc = payload.model_dump()
    await db.categories.insert_one(doc)
    return {"ok": True, "category": {**doc, "count": 0}}


@api_router.put("/admin/categories/{name}")
async def admin_update_category(name: str, payload: CategoryIn, _: bool = __import__('fastapi').Depends(require_admin)):
    result = await db.categories.update_one({"name": name}, {"$set": payload.model_dump()})
    if payload.name != name:
        await db.products.update_many({"category": name}, {"$set": {"category": payload.name}})
    return {"ok": True, "modified": result.modified_count}


@api_router.delete("/admin/categories/{name}")
async def admin_delete_category(name: str, _: bool = __import__('fastapi').Depends(require_admin)):
    count = await db.products.count_documents({"category": name})
    if count > 0:
        raise HTTPException(400, f"Category has {count} products — remove them first")
    await db.categories.delete_one({"name": name})
    return {"ok": True}


@api_router.post("/admin/products")
async def admin_create_product(payload: ProductIn, _: bool = __import__('fastapi').Depends(require_admin)):
    if await db.products.find_one({"slug": payload.slug}):
        raise HTTPException(400, "Slug exists")
    doc = payload.model_dump()
    doc["product_id"] = f"prd_{uuid.uuid4().hex[:10]}"
    await db.products.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/admin/products/{product_id}")
async def admin_update_product(product_id: str, payload: ProductIn, _: bool = __import__('fastapi').Depends(require_admin)):
    result = await db.products.update_one({"product_id": product_id}, {"$set": payload.model_dump()})
    if result.matched_count == 0: raise HTTPException(404, "Not found")
    return {"ok": True}


@api_router.delete("/admin/products/{product_id}")
async def admin_delete_product(product_id: str, _: bool = __import__('fastapi').Depends(require_admin)):
    r = await db.products.delete_one({"product_id": product_id})
    if r.deleted_count == 0: raise HTTPException(404, "Not found")
    return {"ok": True}


# =========== Guides ===========
@api_router.get("/guides")
async def list_guides():
    return await db.guides.find({}, {"_id": 0, "sections": 0}).to_list(200)


@api_router.get("/guides/{slug}")
async def get_guide(slug: str):
    g = await db.guides.find_one({"slug": slug}, {"_id": 0})
    if not g: raise HTTPException(404, "Not found")
    return g


# =========== Orders ===========
@api_router.post("/orders")
async def create_order(payload: CheckoutInput):
    if not payload.items: raise HTTPException(400, "Cart is empty")
    line_items, subtotal = [], 0
    for ci in payload.items:
        p = await db.products.find_one({"product_id": ci.product_id}, {"_id": 0})
        if not p: continue
        line_total = int(p["price"]) * int(ci.quantity)
        subtotal += line_total
        line_items.append({
            "product_id": p["product_id"], "name": p["name"], "price": p["price"],
            "image": p["image"], "quantity": ci.quantity, "line_total": line_total,
        })
    if not line_items: raise HTTPException(400, "No valid items")
    shipping = 0 if subtotal >= 25000 else 1990
    total = subtotal + shipping
    order_id = f"ord_{uuid.uuid4().hex[:10]}"
    doc = {
        "order_id": order_id, "email": payload.email.lower(), "full_name": payload.full_name,
        "phone": payload.phone, "items": line_items, "subtotal": subtotal, "shipping": shipping,
        "total": total, "address": payload.address, "city": payload.city,
        "postal_code": payload.postal_code, "country": payload.country, "notes": payload.notes,
        "status": "PENDING", "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.orders.insert_one(doc)
    return {"order_id": order_id, "total": total, "status": "PENDING"}


@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    o = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not o: raise HTTPException(404, "Not found")
    return o


# =========== SimplePay ===========
def _sp_json(v): return json.dumps(v, ensure_ascii=False, separators=(",", ":"))


def _sp_sign(msg: str) -> str:
    d = hmac.new(SP_KEY.encode(), msg.encode(), hashlib.sha384).digest()
    return base64.b64encode(d).decode()


def _sp_valid(msg: str, sig: str) -> bool:
    return hmac.compare_digest(_sp_sign(msg), sig)


@api_router.post("/payments/start")
async def payments_start(request: Request):
    body = await request.json()
    order_id = body.get("order_id")
    return_origin = body.get("return_origin") or ""
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order: raise HTTPException(404, "Order not found")
    payload = {
        "salt": secrets.token_hex(16),
        "merchant": SP_MID,
        "orderRef": order_id.replace("_", "")[:32],
        "customer": order["full_name"],
        "customerEmail": order["email"],
        "language": "HU",
        "currency": "HUF",
        "total": int(order["total"]),
        "methods": ["CARD"],
        "timeout": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat(),
        "url": f"{return_origin}/order/{order_id}",
        "sdkVersion": "SimplePayV2.1_Payment_Python_Custom",
        "invoice": {
            "name": order["full_name"], "country": "HU",
            "state": "", "city": order["city"],
            "zip": order["postal_code"], "address": order["address"],
        },
    }
    msg = _sp_json(payload)
    try:
        async with httpx.AsyncClient(timeout=15) as http:
            r = await http.post(
                f"{SP_BASE}/start",
                content=msg.encode(),
                headers={
                    "Content-Type": "application/json",
                    "Signature": _sp_sign(msg),
                },
            )
        data = r.json()
    except Exception as e:
        logger.error(f"SimplePay start failed: {e}")
        # Fallback: mark as reserved
        await db.orders.update_one({"order_id": order_id}, {"$set": {"status": "RESERVED", "payment_error": str(e)}})
        return {"paymentUrl": None, "status": "RESERVED", "message": "Payment gateway unreachable — order reserved"}
    if not data.get("paymentUrl"):
        await db.orders.update_one({"order_id": order_id}, {"$set": {"status": "RESERVED", "simplepay_response": data}})
        return {"paymentUrl": None, "status": "RESERVED", "message": data.get("errorCodes") or "SimplePay start failed"}
    await db.orders.update_one({"order_id": order_id}, {"$set": {"transaction_id": data.get("transactionId"), "simplepay_response": data}})
    return {"paymentUrl": data["paymentUrl"], "status": "REDIRECTING", "order_id": order_id}


@api_router.post("/payments/ipn")
async def payments_ipn(request: Request):
    raw = (await request.body()).decode()
    sig = request.headers.get("Signature")
    if not sig or not _sp_valid(raw, sig):
        raise HTTPException(400, "Invalid IPN signature")
    msg = json.loads(raw)
    order_ref = msg.get("orderRef")
    status = msg.get("status")
    if order_ref and status:
        # find order (order_ref stripped underscore)
        order = await db.orders.find_one({"order_id": {"$regex": order_ref}}, {"_id": 0})
        if order:
            await db.orders.update_one({"order_id": order["order_id"]}, {"$set": {"status": status, "ipn": msg}})
    ack = dict(msg)
    ack["receiveDate"] = datetime.now(timezone.utc).isoformat()
    body = _sp_json(ack)
    return JSONResponse(content=json.loads(body), headers={"Signature": _sp_sign(body)})


# =========== Seed ===========
from seed_data import PRODUCTS_SEED, GUIDES_SEED, CATEGORIES_SEED


@app.on_event("startup")
async def seed():
    if await db.products.count_documents({}) == 0:
        await db.products.insert_many([dict(p) for p in PRODUCTS_SEED])
        logger.info(f"Seeded {len(PRODUCTS_SEED)} products")
    if await db.guides.count_documents({}) == 0:
        await db.guides.insert_many([dict(g) for g in GUIDES_SEED])
    if await db.categories.count_documents({}) == 0:
        await db.categories.insert_many([dict(c) for c in CATEGORIES_SEED])


@api_router.get("/")
async def root():
    return {"message": "H'INFINI Candles API", "status": "ok"}


app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','), allow_methods=["*"], allow_headers=["*"])


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
