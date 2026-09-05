# H'INFINI Candles — PRD (updated Feb 2026)
## User choices
- Full ecom + educational content
- Payments: SimplePay (Hungarian, PUBLICTESTHUF sandbox)
- No auth (guest checkout only)
- Bilingual HU/EN with flag toggle in top-right (default: HU)
- Dark charcoal + gold theme, "H'INFINI Candles" branding
- Admin panel for products & categories (token-gated)
- Discover page with random product ordering

## Implemented
- Dark+gold theme, H'INFINI infinity logo, Cormorant + Manrope fonts
- 28 products in HUF across 8 categories (Candles, Wax, Fragrance/Essential Oils, Wicks, Containers, Tools, Kits)
- 7 educational guides in Hungarian
- Bilingual UI (HU/EN) with flag toggle
- SimplePay v2.1 backend integration (start/IPN with HMAC-SHA384) — sandbox
- Admin panel `/admin` with token `hinfini-admin-2026`
- Discover page `/discover` with shuffle button
- Guest checkout, cart persistence (hydration bug fixed)

## Backlog
- Real SimplePay IPN over public URL (needs deployed URL for testing)
- Order confirmation emails (Resend)
- Image upload in admin (currently URL only)
