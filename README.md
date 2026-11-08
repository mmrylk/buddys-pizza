# Buddy's Pizza — web app

Full-stack site and online ordering for Buddy's Pizza, 212 W Broadway St, Frankfort, KY.
Next.js 15 (App Router) · React 19 · Tailwind CSS v4 · Framer Motion · React Three Fiber · Stripe.

```bash
npm install
cp .env.example .env.local   # optional: everything runs without keys (demo mode)
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
```

## Pages

| Route | What it does |
| --- | --- |
| `/` | WebGL hero (fbm fire shader, GPU embers, 3D slice), live open/closed badge, Great Dane / slices / dog-wall features, filterable menu teaser, Google rating + reviews, map, distance finder, parking modal |
| `/menu` | Full menu: search, dietary filters, scroll-spy category tabs, item customizer (size, toppings, dressings, sauces, notes, qty), cart drawer |
| `/checkout` | Pickup / delivery / dine-in, ASAP or 15-minute time slots (store time zone), details, tip 15/18/20/custom, Stripe Payment Element (cards, Apple Pay, Google Pay) |
| `/checkout/success` | Order ticket. Polls payment status until Stripe confirms |
| `/wall-of-fame` | Buddy tribute, community dog gallery, photo submission |
| `/wall-of-fame/admin` | Crew moderation queue (needs `ADMIN_TOKEN`) |
| `/contact` | Click-to-call, hours, map, catering / contact form |

## API

| Route | Notes |
| --- | --- |
| `GET /api/menu` | Menu, toppings, live status, available slots |
| `POST /api/orders` | Validates and **re-prices every line on the server**, checks time slot and lunch-window rules, creates a Stripe PaymentIntent |
| `GET /api/orders/:id` | Public order view (no contact details); syncs PaymentIntent status |
| `POST /api/orders/:id/demo-pay` | Demo mode only. Disabled when Stripe keys exist |
| `POST /api/stripe/webhook` | Signature-verified; marks orders paid / failed |
| `GET/POST /api/dogs` | Approved dogs / new submission (magic-byte image check, 5 MB cap, honeypot, rate limit) |
| `PATCH /api/dogs/:id` | Approve or reject (`x-admin-token`) |
| `GET /api/dogs/:id/photo` | Photos are stored outside `/public`; pending ones are admin-only |
| `POST /api/contact` | Stored + optional `CONTACT_WEBHOOK_URL` forward |
| `GET /api/reviews` | Google Places API (New) if keyed; otherwise rating summary only. Never invents review text |

## Where things live

- `lib/menu.ts` — **the menu and every price.** Edit here; checkout follows automatically.
- `lib/hours.ts` — hours, lunch window, slot rules (America/New_York).
- `lib/pricing.ts` — shared cents-based pricing, tax (KY 6%), tips.
- `lib/db.ts` — JSON-file storage. Fine for one Node server with a persistent disk. Swap for Postgres/SQLite before running on serverless hosts.
- `components/hero/HeroScene.tsx` — the 3D canvas and shaders.

## Before launch — confirm with the shop

Prices come from the shop's printed menu dated **Oct 12, 2026** (`Buddys-Menu_10-12-26.pdf` on the links2thebluegrass.com listing). They differ from older figures (e.g. 12" cheese is $12, not $8).

1. **Topping prices.** The PDF lists $2 / $2.50 / $3 / $3.50 / $4 / $5 without a clear grid. Coded as regular $2 / $3 / $4 and specialty $2.50 / $3.50 / $5 for 12" / 16" / 22".
2. **Single slice $2.50.** Not on the Oct 2026 menu; kept from older info, lunch-window only.
3. **Wings and the $6 lunch combo.** Not on the Oct 2026 menu, so not orderable.
4. **Delivery.** Shown with a "we'll call to confirm" note; set `NEXT_PUBLIC_DELIVERY=off` if the shop doesn't deliver.
5. **Gluten-free 10" cauliflower crust.** No price on the menu; site tells customers to call.
6. **Map pin coordinates** in `lib/site.ts` (used only for the distance estimate).
7. **Hero video.** No footage is bundled; see `.env.example`.
