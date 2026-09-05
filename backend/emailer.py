import asyncio
import html
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

import httpx

import config

logger = logging.getLogger("emailer")

GOLD, BG, SURFACE, TEXT, MUTED, BORDER = "#D4AF6E", "#1A1917", "#24221E", "#F0EAD6", "#B8AE95", "#3d3835"


def _fmt(huf) -> str:
    return f"{int(huf):,}".replace(",", " ") + " Ft"


def _esc(v) -> str:
    return html.escape(str(v or ""))


def _site(path: str = "") -> str:
    return f"{config.PUBLIC_SITE_URL}{path}"


def _layout(title: str, body_html: str, footer_note: str = "") -> str:
    legal = " · ".join(
        f'<a href="{_site(p)}" style="color:{MUTED};text-decoration:underline">{_esc(l)}</a>'
        for p, l in [("/aszf", "ÁSZF"), ("/adatkezeles", "Adatkezelés"), ("/szallitas", "Szállítás"), ("/elallas", "Elállás")]
    )
    support = f"Ügyfélszolgálat: {_esc(config.SUPPORT_EMAIL)}" if config.SUPPORT_EMAIL else "Ügyfélszolgálat: [SUPPORT_EMAIL beállítandó]"
    return f"""<!doctype html><html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>{_esc(title)}</title></head>
<body style="margin:0;padding:0;background:{BG};font-family:Georgia,'Times New Roman',serif;color:{TEXT}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{BG}"><tr><td align="center" style="padding:32px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:{SURFACE};border:1px solid {BORDER}">
<tr><td style="padding:28px 32px;border-bottom:1px solid {BORDER}">
<span style="font-size:26px;letter-spacing:2px;color:{GOLD}">H'INFINI</span>
<span style="font-size:11px;letter-spacing:4px;color:{MUTED};font-family:Arial,sans-serif"> &nbsp;CANDLES</span></td></tr>
<tr><td style="padding:32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:{TEXT}">
<h1 style="margin:0 0 18px;font-family:Georgia,serif;font-weight:normal;font-size:28px;color:{TEXT}">{_esc(title)}</h1>
{body_html}
</td></tr>
<tr><td style="padding:22px 32px;border-top:1px solid {BORDER};font-family:Arial,sans-serif;font-size:12px;color:{MUTED};line-height:1.6">
{_esc(footer_note)}<br>{support}<br>{legal}<br>
<span style="color:#6f685f">Ez egy tranzakciós üzenet a rendeléseddel kapcsolatban. [CÉGNÉV, SZÉKHELY, ADÓSZÁM — kitöltendő]</span>
</td></tr></table></td></tr></table></body></html>"""


def _kv_rows(rows) -> str:
    return "".join(
        f'<tr><td style="padding:6px 0;color:{MUTED}">{_esc(k)}</td><td style="padding:6px 0;text-align:right">{_esc(v)}</td></tr>'
        for k, v in rows
    )


def _items_table(order) -> str:
    rows = "".join(
        f'<tr><td style="padding:8px 0;border-bottom:1px solid {BORDER}">{_esc(i["name"])}<br><span style="color:{MUTED};font-size:12px">{i["quantity"]} × {_fmt(i["price"])}</span></td>'
        f'<td style="padding:8px 0;border-bottom:1px solid {BORDER};text-align:right;white-space:nowrap">{_fmt(i["line_total"])}</td></tr>'
        for i in order["items"]
    )
    totals = _kv_rows([("Részösszeg", _fmt(order["subtotal"])), ("Szállítási díj", "Ingyenes" if order["shipping"] == 0 else _fmt(order["shipping"]))])
    return f"""<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">{rows}{totals}
<tr><td style="padding:12px 0 0;font-size:18px;color:{GOLD}">Végösszeg</td><td style="padding:12px 0 0;text-align:right;font-size:18px;color:{GOLD}">{_fmt(order["total"])}</td></tr></table>"""


def _items_text(order) -> str:
    lines = [f"- {i['name']} — {i['quantity']} × {_fmt(i['price'])} = {_fmt(i['line_total'])}" for i in order["items"]]
    lines += [f"Részösszeg: {_fmt(order['subtotal'])}", f"Szállítás: {'Ingyenes' if order['shipping'] == 0 else _fmt(order['shipping'])}", f"Végösszeg: {_fmt(order['total'])}"]
    return "\n".join(lines)


SHIPPING_LABEL = {"home": "Házhozszállítás", "pickup": "Csomagpont"}
PAY_LABEL = {"UNPAID": "Fizetésre vár", "PAID": "Fizetve", "FAILED": "Sikertelen / megszakadt", "RESERVED": "Fizetés nélkül rögzítve"}


def _addr(order) -> str:
    return f"{order['full_name']}, {order['postal_code']} {order['city']}, {order['address']}, {order.get('country', '')}"


def _badge(text: str, ok: bool) -> str:
    color = GOLD if ok else MUTED
    return f'<span style="display:inline-block;padding:4px 12px;border:1px solid {color};color:{color};border-radius:999px;font-size:12px;letter-spacing:1px;text-transform:uppercase">{_esc(text)}</span>'


# ---------- Customer templates ----------
def tpl_order_created(order):
    oid = order["order_id"]
    subject = f"Rendelésed megérkezett – H'INFINI #{oid}"
    date = order["created_at"][:16].replace("T", " ")
    body = f"""
<p>Kedves {_esc(order['full_name'])}!</p>
<p>Köszönjük a rendelésedet. Az alábbi tételeket rögzítettük.</p>
<p>{_badge('Rendelés megérkezett', True)} &nbsp; {_badge('Fizetés: ' + PAY_LABEL.get(order.get('payment_status', 'UNPAID'), ''), order.get('payment_status') == 'PAID')}</p>
<p style="color:{MUTED};font-size:13px">A „rendelés megérkezett” állapot nem jelenti a fizetés sikerességét. A sikeres fizetésről külön visszaigazolást küldünk.</p>
{_items_table(order)}
<table role="presentation" width="100%" style="margin-top:22px;font-size:14px">{_kv_rows([
    ("Rendelésazonosító", oid), ("Rendelés dátuma", date), ("Fizetési mód", "Bankkártya (SimplePay)"),
    ("Szállítási mód", SHIPPING_LABEL.get(order.get('shipping_method'), '-')), ("Szállítási cím", _addr(order)), ("Kapcsolattartó e-mail", order['email'])])}</table>
<p style="margin-top:24px"><a href="{_site('/order/' + oid)}" style="background:{GOLD};color:{BG};padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:bold">Rendelés megtekintése</a></p>"""
    text = f"""Kedves {order['full_name']}!

Köszönjük a rendelésedet (#{oid}, {date}). Állapot: rendelés megérkezett — a fizetés állapota: {PAY_LABEL.get(order.get('payment_status', 'UNPAID'))}.
A sikeres fizetésről külön e-mailt küldünk.

{_items_text(order)}

Szállítási mód: {SHIPPING_LABEL.get(order.get('shipping_method'), '-')}
Szállítási cím: {_addr(order)}
Rendelés: {_site('/order/' + oid)}
ÁSZF: {_site('/aszf')} · Adatkezelés: {_site('/adatkezeles')} · Szállítás: {_site('/szallitas')} · Elállás: {_site('/elallas')}"""
    return subject, _layout("Rendelésed megérkezett", body, "Köszönjük, hogy a H'INFINI-t választottad."), text


def tpl_payment_success(order):
    oid = order["order_id"]
    subject = f"Sikeres fizetés – H'INFINI #{oid}"
    tx = order.get("transaction_id") or "-"
    body = f"""<p>Kedves {_esc(order['full_name'])}!</p><p>A fizetésedet a SimplePay visszaigazolta. {_badge('Fizetve', True)}</p>
<table role="presentation" width="100%" style="font-size:14px">{_kv_rows([("Fizetett összeg", _fmt(order['total'])), ("SimplePay tranzakció", tx), ("Rendelésazonosító", oid)])}</table>
<p style="margin-top:20px"><strong>Következő lépések:</strong> a rendelésedet előkészítjük és a csomag feladásáról külön e-mailt küldünk.</p>
<p><a href="{_site('/order/' + oid)}" style="color:{GOLD}">Rendelés megtekintése</a></p>"""
    text = f"Kedves {order['full_name']}!\n\nA fizetésed sikeres. Összeg: {_fmt(order['total'])}. Tranzakció: {tx}. Rendelés: #{oid}.\nKövetkező lépés: csomagolás, majd feladási értesítő.\n{_site('/order/' + oid)}"
    return subject, _layout("Sikeres fizetés", body), text


def tpl_payment_failed(order):
    oid = order["order_id"]
    subject = f"A fizetés nem fejeződött be – H'INFINI #{oid}"
    body = f"""<p>Kedves {_esc(order['full_name'])}!</p><p>A #{oid} rendelésed fizetése nem fejeződött be. A rendelésed rögzítve maradt, de fizetés nélkül nem tudjuk feladni.</p>
<p>Ha szeretnéd folytatni, írj nekünk, és segítünk a fizetés újraindításában.</p>
<p><a href="{_site('/order/' + oid)}" style="color:{GOLD}">Rendelés megtekintése</a></p>"""
    text = f"Kedves {order['full_name']}!\n\nA #{oid} rendelésed fizetése nem fejeződött be. Ha szeretnéd folytatni, írj nekünk.\n{_site('/order/' + oid)}"
    return subject, _layout("A fizetés nem fejeződött be", body), text


def tpl_shipped(order):
    oid = order["order_id"]
    subject = f"Úton van a rendelésed – H'INFINI #{oid}"
    tr = order.get("tracking") or {}
    rows = [("Szállító", tr.get("carrier") or "-"), ("Nyomkövetési szám", tr.get("number") or "-"), ("Várható kézbesítés", tr.get("eta") or "Hamarosan")]
    link = f'<p><a href="{_esc(tr["url"])}" style="color:{GOLD}">Csomag követése</a></p>' if tr.get("url") else ""
    body = f"<p>Kedves {_esc(order['full_name'])}!</p><p>A csomagodat feladtuk.</p><table role='presentation' width='100%' style='font-size:14px'>{_kv_rows(rows)}</table>{link}"
    text = f"Kedves {order['full_name']}!\n\nA #{oid} csomagodat feladtuk.\nSzállító: {rows[0][1]}\nNyomkövetés: {rows[1][1]} {tr.get('url', '')}\n"
    return subject, _layout("Úton van a rendelésed", body), text


def tpl_cancelled(order):
    oid = order["order_id"]
    subject = f"Rendelés törölve – H'INFINI #{oid}"
    refund = "Ha a rendelést már kifizetted, a visszatérítést elindítjuk az eredeti fizetési módra." if order.get("payment_status") == "PAID" else "A rendeléshez nem történt sikeres fizetés, így nincs visszatérítendő összeg."
    body = f"<p>Kedves {_esc(order['full_name'])}!</p><p>A #{oid} rendelésedet töröltük. Összeg: {_fmt(order['total'])}.</p><p>{refund}</p><p>Kérdés esetén írj ügyfélszolgálatunknak.</p>"
    text = f"Kedves {order['full_name']}!\n\nA #{oid} rendelésedet töröltük. Összeg: {_fmt(order['total'])}.\n{refund}"
    return subject, _layout("Rendelés törölve", body), text


# ---------- Admin templates ----------
def _admin_order_body(order, headline):
    oid = order["order_id"]
    items = "".join(f"<li>{_esc(i['name'])} × {i['quantity']}</li>" for i in order["items"])
    return f"""<p>{_esc(headline)}</p>
<table role="presentation" width="100%" style="font-size:14px">{_kv_rows([
    ("Rendelés", oid), ("Időpont", order['created_at'][:16].replace('T', ' ')), ("Összeg", _fmt(order['total'])),
    ("Fizetés", PAY_LABEL.get(order.get('payment_status', 'UNPAID'), '')), ("Szállítási mód", SHIPPING_LABEL.get(order.get('shipping_method'), '-'))])}</table>
<ul style="font-size:14px">{items}</ul>
<p><a href="{_site('/admin?order=' + oid)}" style="background:{GOLD};color:{BG};padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:bold">Rendelés az adminban</a></p>
<p style="color:{MUTED};font-size:12px">A vevő személyes adatai (cím, telefon) csak az admin felületen érhetők el.</p>"""


def tpl_admin_new_order(order):
    oid = order["order_id"]
    return f"Új rendelés #{oid} – {_fmt(order['total'])}", _layout("Új rendelés érkezett", _admin_order_body(order, "Új rendelés érkezett a webshopba.")), f"Új rendelés #{oid}, {_fmt(order['total'])}. {_site('/admin?order=' + oid)}"


def tpl_admin_paid(order):
    oid = order["order_id"]
    return f"Sikeres fizetés #{oid}", _layout("Sikeres fizetés", _admin_order_body(order, "A SimplePay sikeres fizetést igazolt vissza.")), f"Sikeres fizetés #{oid}. {_site('/admin?order=' + oid)}"


def tpl_admin_payment_failed(order):
    oid = order["order_id"]
    return f"Sikertelen / függő fizetés #{oid}", _layout("Sikertelen vagy függő fizetés", _admin_order_body(order, "A fizetés sikertelen vagy megszakadt.")), f"Sikertelen fizetés #{oid}. {_site('/admin?order=' + oid)}"


def tpl_admin_cancel_request(order):
    oid = order["order_id"]
    return f"Törlési / elállási kérelem #{oid}", _layout("Törlés / elállás", _admin_order_body(order, "Törlési vagy elállási kérelem érkezett.")), f"Törlési kérelem #{oid}."


def tpl_admin_low_stock(product):
    name, stock = product["name"], product.get("stock", 0)
    label = "Elfogyott" if stock <= 0 else "Alacsony készlet"
    body = f"<p>{_esc(name)} — készlet: <strong>{stock}</strong> ({label}).</p><p><a href='{_site('/admin')}' style='color:{GOLD}'>Készlet kezelése az adminban</a></p>"
    return f"{label}: {name}", _layout(label, body), f"{label}: {name} (készlet: {stock})"


TEMPLATES = {
    "order_created": tpl_order_created, "payment_success": tpl_payment_success,
    "payment_failed": tpl_payment_failed, "shipped": tpl_shipped, "cancelled": tpl_cancelled,
    "admin_new_order": tpl_admin_new_order, "admin_paid": tpl_admin_paid,
    "admin_payment_failed": tpl_admin_payment_failed, "admin_cancel_request": tpl_admin_cancel_request,
    "admin_low_stock": tpl_admin_low_stock,
}


# ---------- Provider ----------
async def _deliver(to: str, subject: str, html_body: str, text_body: str) -> tuple[str, Optional[str], Optional[str]]:
    """Returns (status, provider_id, error)."""
    if config.EMAIL_PROVIDER == "none" or not config.EMAIL_FROM:
        return "SKIPPED", None, "EMAIL_PROVIDER nincs beállítva (fejlesztői mód)"
    sender = f"{config.EMAIL_FROM_NAME} <{config.EMAIL_FROM}>"
    try:
        async with httpx.AsyncClient(timeout=20) as http:
            if config.EMAIL_PROVIDER == "resend":
                payload = {"from": sender, "to": [to], "subject": subject, "html": html_body, "text": text_body}
                if config.EMAIL_REPLY_TO: payload["reply_to"] = config.EMAIL_REPLY_TO
                r = await http.post("https://api.resend.com/emails", json=payload, headers={"Authorization": f"Bearer {config.RESEND_API_KEY}"})
                if r.status_code >= 300: return "FAILED", None, f"Resend {r.status_code}: {r.text[:200]}"
                return "SENT", r.json().get("id"), None
            if config.EMAIL_PROVIDER == "sendgrid":
                payload = {
                    "personalizations": [{"to": [{"email": to}]}],
                    "from": {"email": config.EMAIL_FROM, "name": config.EMAIL_FROM_NAME},
                    "subject": subject,
                    "content": [{"type": "text/plain", "value": text_body}, {"type": "text/html", "value": html_body}],
                }
                if config.EMAIL_REPLY_TO: payload["reply_to"] = {"email": config.EMAIL_REPLY_TO}
                r = await http.post("https://api.sendgrid.com/v3/mail/send", json=payload, headers={"Authorization": f"Bearer {config.SENDGRID_API_KEY}"})
                if r.status_code >= 300: return "FAILED", None, f"SendGrid {r.status_code}: {r.text[:200]}"
                return "SENT", r.headers.get("X-Message-Id"), None
    except Exception as e:  # network errors
        return "FAILED", None, str(e)[:200]
    return "FAILED", None, f"Ismeretlen EMAIL_PROVIDER: {config.EMAIL_PROVIDER}"


async def send_event(db, event: str, entity: dict, to: Optional[str] = None, idem_suffix: str = "", force: bool = False) -> Optional[dict]:
    """Idempotent: one email per (event, entity id, recipient) unless force=True (manual resend)."""
    tpl = TEMPLATES.get(event)
    if not tpl: return None
    recipient = to or (config.ORDER_NOTIFY_EMAIL if event.startswith("admin_") else entity.get("email"))
    if not recipient:
        return None
    ref_id = entity.get("order_id") or entity.get("product_id") or ""
    idem = f"{event}:{ref_id}:{recipient}{idem_suffix}"
    if not force and await db.email_logs.find_one({"idempotency_key": idem, "status": {"$in": ["SENT", "SKIPPED"]}}):
        return None
    subject, html_body, text_body = tpl(entity)
    status, pid, err = await _deliver(recipient, subject, html_body, text_body)
    log = {
        "log_id": f"eml_{uuid.uuid4().hex[:10]}", "order_id": entity.get("order_id"), "event": event,
        "recipient": recipient, "subject": subject, "status": status, "provider": config.EMAIL_PROVIDER,
        "provider_id": pid, "error": err, "idempotency_key": idem, "resend": force,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.email_logs.insert_one(log)
    log.pop("_id", None)
    if status == "FAILED": logger.error(f"Email {event} to {recipient} failed: {err}")
    return log


def fire(coro):
    """Schedule email sending without blocking the request."""
    async def _run():
        try: await coro
        except Exception as e: logger.exception(f"email task failed: {e}")
    asyncio.create_task(_run())
