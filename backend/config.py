import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")


def env(key: str, default: str = "") -> str:
    return os.environ.get(key, default)


APP_ENV = env("APP_ENV", "development")
IS_PROD = APP_ENV == "production"

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
CORS_ORIGINS = env("CORS_ORIGINS", "*")
ADMIN_TOKEN = env("ADMIN_TOKEN")
PUBLIC_SITE_URL = env("PUBLIC_SITE_URL", "").rstrip("/")

# SimplePay
SP_MID = env("SIMPLEPAY_MERCHANT_ID")
SP_KEY = env("SIMPLEPAY_SECRET_KEY")
SP_BASE = env("SIMPLEPAY_BASE_URL", "https://sandbox.simplepay.hu/payment/v2")

# Shipping
FREE_SHIPPING_FROM = int(env("FREE_SHIPPING_FROM", "25000"))
SHIPPING_FEE_HOME = int(env("SHIPPING_FEE_HOME", "1990"))
SHIPPING_FEE_PICKUP = int(env("SHIPPING_FEE_PICKUP", "1290"))
LOW_STOCK_THRESHOLD = int(env("LOW_STOCK_THRESHOLD", "5"))

# Storage
STORAGE_DRIVER = env("STORAGE_DRIVER", "local")  # local | s3
UPLOAD_DIR = Path(env("UPLOAD_DIR", str(ROOT_DIR / "uploads")))
S3_ENDPOINT_URL = env("S3_ENDPOINT_URL")
S3_BUCKET = env("S3_BUCKET")
S3_ACCESS_KEY_ID = env("S3_ACCESS_KEY_ID")
S3_SECRET_ACCESS_KEY = env("S3_SECRET_ACCESS_KEY")
S3_REGION = env("S3_REGION", "auto")
S3_PUBLIC_BASE_URL = env("S3_PUBLIC_BASE_URL", "").rstrip("/")
MAX_UPLOAD_MB = int(env("MAX_UPLOAD_MB", "5"))
ALLOWED_IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif"}

# Email
EMAIL_PROVIDER = env("EMAIL_PROVIDER", "none")  # none | resend | sendgrid
RESEND_API_KEY = env("RESEND_API_KEY")
SENDGRID_API_KEY = env("SENDGRID_API_KEY")
EMAIL_FROM_NAME = env("EMAIL_FROM_NAME", "H'INFINI Candles")
EMAIL_FROM = env("EMAIL_FROM", "")
EMAIL_REPLY_TO = env("EMAIL_REPLY_TO", "")
ORDER_NOTIFY_EMAIL = env("ORDER_NOTIFY_EMAIL", "")
SUPPORT_EMAIL = env("SUPPORT_EMAIL", "")
SUPPORT_PHONE = env("SUPPORT_PHONE", "")

# Invoicing
INVOICE_PROVIDER = env("INVOICE_PROVIDER", "none")  # none | szamlazzhu | billingo
INVOICE_TRIGGER = env("INVOICE_TRIGGER", "paid")  # paid | fulfilled
INVOICE_API_KEY = env("INVOICE_API_KEY")
