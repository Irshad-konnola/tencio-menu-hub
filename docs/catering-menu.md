# Catering menu

Kolar Kitchen has two views over the same catalog and prices:

- `/{slug}` is the outlet menu. For catering-enabled tenants it shows in-stock items only.
- `/{slug}/catering` shows every item in public categories, regardless of outlet stock.
- Hidden categories and their dishes are excluded server-side from both views.
- Chill Chai retains its existing stock display and has no catering route until explicitly enabled.
- No copied items, alternate prices, checkout, or automatic discounts are introduced. Discounts remain in billing/quotations.

## Setup and use

1. Apply `supabase/migrations/05_catering_menu.sql` in the target database.
2. Deploy the application. The migration enables Kolar Kitchen and seeds its supplied enquiry number, `+91 8075603490`.
3. Open the owner's dashboard, then Settings → Catering menu.
4. Preview or copy the permanent link, share it on WhatsApp, download the QR PNG, or use Share QR on supported devices.
5. Edit the catering contact number in Settings when needed. Clearing it hides the enquiry button; link/QR sharing still works.

The QR contains the permanent catering URL, so future menu edits do not require
reprinting it. Generate client QR codes on the deployed domain. A QR generated in
localhost preview points to localhost and is for testing only.

WhatsApp link sharing opens a prepared message for the user to send. Native QR
sharing lets the user select WhatsApp when file sharing is supported. Otherwise,
the image downloads for manual attachment; browsers cannot attach a PNG through
a `wa.me` URL. No WhatsApp messages are sent automatically.

Super Admin can enable/disable `catering_menu`. Disabled or unknown catering
routes return 404. The feature is checked server-side. The new contact update
verifies the owner's access token, tenant ownership, and feature entitlement.
Super Admin listing and feature mutation actions also verify their session.
Only explicit public fields are returned by the menu loader.

## Verification

```sh
npm test
npm run lint
npm run build
npm audit --omit=dev
```

The automated suite uses a disposable local HTTP Supabase fixture and the real
Supabase SDK. It covers available/full catalogs, unchanged prices/units, hidden
categories, tenant isolation, searches, sorting, URL encoding, number validation,
feature gating/revocation, error handling, owner writes and denied forged or
cross-tenant writes. It does not connect to the real database.

For route checks and UI QA, run these in separate terminals:

```sh
npm run preview:catering
npm run test:routes
```

Open `http://127.0.0.1:3100/kolar-kitchen/catering`. Owner fixture credentials are
`owner@example.test` / `fixture-password`. Every auth/database request targets the
local fixture, not the live clients. Its state resets when restarted. Build output
is isolated under `.next-catering-preview` so an existing dev server can stay open.
The fixture implements HTTP database/auth behavior, not Supabase Realtime.

| Check | Expected result |
| --- | --- |
| Kolar outlet | Chicken Biryani only |
| Kolar catering | Biryani, Beef Roast, Palada Payasam; no unavailable badges |
| Hidden category | Private Test Category and Secret Dish absent everywhere |
| Search “Beef” | Out-of-stock Beef Roast found in catering |
| Catering `?table=99` | No table badge or waiter button |
| Chill outlet | Masala Chai and unavailable Iced Tea remain visible |
| Chill catering / unknown restaurant | HTTP 404 |
| Copy link | Clipboard success or manual-copy fallback |
| Enquiry link | `wa.me/918075603490`, event details and canonical catering link |
| Owner Settings | Permanent link, QR, download/share and contact editor |
| Invalid contact | Error without database mutation |
| Clear contact | Enquiry button disappears; sharing still works |
| Toggle stock | Outlet visibility changes; catering catalog/prices remain intact |
| Hide category | Dishes disappear from both views |
| Disable catering | Fresh requests return 404; refreshed open view becomes unavailable |

Before rollout, verify actual Supabase publication/RLS settings, two-device live
updates, a physical QR scan, and mobile WhatsApp file sharing on the client's
device. The local fixture cannot certify those platform-specific behaviors.

Latest local verification: 20 automated business/data/auth tests and 6 HTTP route
tests passed. Chrome desktop and iPhone SE (375 × 667) layouts were inspected.
Search found out-of-stock catering dishes; Copy link reported success; owner
Settings rendered the QR and correct URL; QR PNG download and contact save were
verified. No WhatsApp message was sent. Native mobile file sharing and physical
QR scanning still need a device check after deployment.

## Existing production risks outside this feature

The review still found pre-existing issues that prevent certifying the whole app
as production-ready: ordinary menu/billing mutation actions do not verify a
request-scoped owner session, staff restrictions rely on browser session state,
and the original schema/RLS/RPC definitions are absent from version control.
These require a separate authentication/policy hardening pass and deployment
verification. The new catering contact action does enforce owner authorization.

The production dependency audit also reported 6 vulnerabilities in the installed
dependency tree (1 moderate, 4 high, 1 critical), including the installed Next.js
16.2.7 and transitive packages. Build/lint success does not clear those findings.
Dependencies have not been upgraded as part of this feature; update and retest
them in the security hardening pass before production sign-off.
