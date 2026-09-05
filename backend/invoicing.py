"""Invoice integration layer. Invoices are issued by an external NAV-compliant provider
(e.g. Számlázz.hu, Billingo). This module only tracks status and provides the hook."""
import logging
from datetime import datetime, timezone

import config

logger = logging.getLogger("invoicing")


def _now(): return datetime.now(timezone.utc).isoformat()


async def issue_invoice(order: dict) -> dict:
    """Return invoice record {status, provider, number, url, issued_at, error}."""
    if config.INVOICE_PROVIDER == "none":
        return {"status": "NOT_CONFIGURED", "provider": "none", "number": None, "url": None, "issued_at": None,
                "error": "INVOICE_PROVIDER nincs beállítva — a számlát a számlázó rendszerben kell kiállítani."}
    if not config.INVOICE_API_KEY:
        return {"status": "ERROR", "provider": config.INVOICE_PROVIDER, "number": None, "url": None, "issued_at": None,
                "error": "INVOICE_API_KEY hiányzik."}
    # TODO: provider-specific API call (Számlázz.hu Agent XML / Billingo v3 REST).
    logger.warning(f"Invoice provider '{config.INVOICE_PROVIDER}' hook not implemented; order {order['order_id']} marked PENDING.")
    return {"status": "PENDING_PROVIDER", "provider": config.INVOICE_PROVIDER, "number": None, "url": None,
            "issued_at": None, "error": None}


async def maybe_issue(db, order: dict, trigger: str):
    """trigger: 'paid' | 'fulfilled'. Runs only once per order."""
    if trigger != config.INVOICE_TRIGGER: return
    if (order.get("invoice") or {}).get("status") in ("ISSUED", "PENDING_PROVIDER"): return
    inv = await issue_invoice(order)
    inv["trigger"] = trigger
    inv["checked_at"] = _now()
    await db.orders.update_one({"order_id": order["order_id"]}, {"$set": {"invoice": inv}})
