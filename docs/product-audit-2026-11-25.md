# Tencio Menu Hub Product Engineering and Business Audit

Date: 25 November 2026. Repository baseline: `7816bfc`. Audience: founder, developer, prospective clients, and future portfolio reviewers.

Tencio Menu Hub has enough functionality to form a useful, focused MVP for small restaurants and catering businesses. It is not ready for broad promotion as a secure restaurant operating system. The biggest gaps concern access control, dependable daily workflows, proof of customer value, and the accuracy of its positioning. Adding more features before addressing those gaps would increase maintenance without resolving the reasons a buyer or recruiter might hesitate.

The strongest near-term product is a managed digital menu with live availability and a shareable catering catalog that opens a structured WhatsApp enquiry. Billing can remain a limited quotation and receipt tool while its correctness and recovery paths are completed. Table service needs a reliable request queue before it should be a headline promise.

## Evidence and confidence

The audit includes the application source, supplied migrations, configuration, documentation, automated tests, a disposable local HTTP fixture, dependency advisories, selected public deployment responses, and read-only permission checks against the Supabase project configured in `.env`. The permission probes used HEAD responses without record bodies. No production records were changed and no messages were sent.

| Check | Observed result | Meaning |
| --- | --- | --- |
| `npm test` | 20 passed | Useful business and data tests, concentrated on menus and catering |
| `npm run test:routes` against the fixture preview | 6 passed | Expected outlet and catering HTML and feature gating work in that fixture |
| `npm run build` | Passed on Next.js 16.2.7 | The application compiles; this does not establish security or correct business behavior |
| `npm run lint` with preview output present | Failed with 7 errors and 7 warnings | Generated `.next-catering-preview` JavaScript is included in linting |
| ESLint restricted to source, tests, scripts and configuration | 0 errors, 7 warnings | The errors above come from generated output; image warnings remain in application code |
| `npm audit --omit=dev` | 6 affected packages: 1 critical, 4 high, 1 moderate | Dependency remediation is required; these are package findings, not six demonstrated exploits |
| Anonymous Supabase HEAD checks | Sensitive-field queries succeeded with visible rows in three tables | Current database access controls require immediate investigation and containment |
| Unknown outlet URL | HTTP 200 locally and on the public deployment | The displayed 404 is a soft 404 |
| Public homepage and catering response headers | HSTS present; CSP, X-Frame-Options and X-Content-Type-Options absent in sampled responses | Browser protections can be improved; this alone does not demonstrate an exploit |

The public deployment sampled was `https://tencio-menu-hub.vercel.app`. Its deployed commit was not independently established. The Supabase checks apply to the project configured in this workspace; confirm that deployment variables target that same project.

Direct PostgreSQL catalog inspection could not connect because the configured database hostname did not resolve. This does not establish that the deployed application is down. Actual policies, indexes, constraints, storage permissions, publication settings and backup configuration remain to be inspected through a working database connection or dashboard.

Computer Use could read the existing Chrome admin screen, then stopped because its safety mechanism could not determine the current browser URL. A complete visual, responsive, keyboard and physical-device audit was therefore not completed. UI findings below distinguish source-level defects and design concerns from measured usability results. No customer interviews, conversion study or load test were conducted. The two clients are founder-reported; their revenue, retention and satisfaction are unknown.

## Overall assessment

| Perspective | Assessment |
| --- | --- |
| Product engineer | A credible narrow MVP is present, but several workflows stop before their operational outcome is dependable |
| Business analyst | Real client-specific requirements are represented; benefits, adoption, willingness to pay and renewal economics need evidence |
| Developer | Next.js and Supabase are suitable for this size of product; trust boundaries and state handling need substantial work |
| Security reviewer | Do not sign off broad rollout with the current anonymous data visibility and staff authorization design |
| QA analyst | Catering has a useful test foundation; permissions, money, service recovery and browser behavior have major coverage gaps |
| Local diner | Browsing without registration is useful; readability, food information, connectivity and service confirmation matter more than animation |
| Restaurant owner | Availability updates and reusable links are useful; a false save or missed waiter request destroys confidence quickly |
| Digital marketer | The landing page overstates scope and sends new prospects to login instead of a sales or trial path |
| CEO | A local, assisted service may be viable before a scalable self-service SaaS; two clients do not yet establish product-market fit |
| Recruiter or technical lead | Real users and thoughtful tradeoffs can make this a strong project; inaccurate claims and weak authorization undermine that story |

These are expert assessments of the evidence, not survey scores or a claim to represent actual customer interviews.

## What is already good

1. The product addresses a concrete job: keeping a restaurant's public menu current without repeatedly replacing a PDF or QR code.
2. A diner can browse without an account or app installation. That removes friction from the core task.
3. The newer public loader explicitly selects public fields and excludes hidden categories and their items before serialization. This is a better boundary than returning a complete Cafe record. See [publicMenu.mjs](../src/lib/publicMenu.mjs).
4. Catering reuses the catalog instead of duplicating dishes and prices. Its separation from outlet stock is understandable, documented and tested.
5. The catering contact update verifies an access token, tenant ownership and feature entitlement. That pattern should inform the older mutations. See [cateringSettings.mjs](../src/lib/cateringSettings.mjs).
6. Sharing has practical fallbacks: encoded WhatsApp links, clipboard fallback, QR download and native file sharing where supported.
7. Catering routes enforce entitlement on the server and return a real 404 when disabled. They do not rely solely on hiding a button.
8. The fixture avoids modifying client data during ordinary development and route testing. Tests cover important cases such as hidden dishes, another tenant, forged tokens and feature revocation.
9. The latest catering migration preserves later feature and contact choices on reruns. That is useful migration discipline.
10. There is a working build and a modest architecture that can be improved without a framework rewrite.

## Immediate security findings

P0 means address before broad rollout or presenting the product as secure. P1 means address before relying on the affected workflow in routine client operations. P2 means schedule after the immediate trust and correctness work, unless a current client is blocked by it.

### P0 Anonymous access to sensitive database fields

A fresh Supabase client used the configured public key, with no user sign-in or persisted session. The JWT role in that key was verified as `anon`. HEAD requests asked for an exact visible-row count while selecting a specific field. HEAD does not return record bodies.

| Table and selected field | HTTP result | Visible rows under the anonymous role |
| --- | --- | --- |
| `Cafe.staffPasscode` | 200 | Yes |
| `Bill.customerPhone` | 200 | Yes |
| `PushSubscriptions.subscription` | 200 | Yes |
| `SuperAdminSession.token` | 200 | None observed |

Successful selection of sensitive columns with nonzero visible rows is strong evidence that those columns and rows are queryable by the public role. Private field values were not fetched. The empty SuperAdminSession result does not prove its policy is safe: it could reflect an empty table, filtering, or another configuration. Anonymous write access was not tested.

This is more urgent than a cosmetic improvement. Restrict private tables and columns, preserve public menu access through a narrow public surface, and verify the change with anonymous and separate tenant accounts. Public row access to a Cafe must not imply public access to its PIN or owner settings. A public application projection alone cannot protect the underlying Data API. Supabase documents both [row policies](https://supabase.com/docs/guides/database/postgres/row-level-security) and [column permissions](https://supabase.com/docs/guides/database/postgres/column-level-security).

After restricting access, invalidate existing staff PINs and replace the design with properly scoped staff credentials. Review access logs and retained customer information to determine whether further incident handling is necessary. The audit establishes excessive visibility, not that someone has already exploited it.

### P0 Ordinary Server Actions do not establish caller authority

Most older actions use a module-level Supabase client configured with the anonymous key. They do not obtain a request-scoped owner or staff identity. Examples include category writes, menu writes, stock toggles, banner writes, bill reads and writes, request resolution, uploads and staff PIN changes. Several updates filter only by the supplied record ID. See [adminActions.js](../src/app/actions/adminActions.js:63), [menu updates](../src/app/actions/adminActions.js:243), [billing](../src/app/actions/adminActions.js:430) and [staff PIN updates](../src/app/actions/adminActions.js:635).

An authenticated browser session does not automatically become the session of a separately created server client. With strict owner RLS, these anonymous server calls may fail. With permissive policies, they may expose operations to callers who should not have them. Tightening policies and forwarding a verified request identity must be handled together; reopening anonymous access to fix a failed dashboard would recreate the problem.

The actions also accept broad client payloads. `createBill` constructs `{ cafeId, ...billData }`, so a supplied `billData.cafeId` can override the first argument. Item updates spread arbitrary `itemData`. Even if database policies block an attack, these interfaces should allow only approved fields and derive tenant scope on the server.

For each action: authenticate, resolve membership and role, verify tenant ownership of the target record, check entitlement, validate an explicit payload, perform the operation, and return only fields the UI needs. Enforce the same boundaries in the database. Next.js explicitly requires authorization within each callable Server Action; a page redirect or hidden UI does not secure it. See [Next.js data security](https://nextjs.org/docs/app/guides/data-security).

### P0 Staff mode is a browser presentation state

`dashboard_unlocked` in sessionStorage decides whether the admin layout renders. A value of `staff` hides owner controls, while another truthy value permits the owner presentation. Staff privileges are therefore not enforced as a distinct server-side role. See [admin layout](../src/app/admin/layout.js:10) and [dashboard initialization](../src/app/admin/page.js:333).

`verifyStaffPasscode` returns a boolean and does not create a signed staff session. On a fresh device, successful staff verification still leaves the dashboard without the Supabase session it requires. On a device retaining an owner's session, staff run within that owner's authentication context. The owner PIN RPC similarly does not visibly establish a new session in the client flow. Its SQL definition is missing, so its internal security cannot be certified. See [login](../src/app/login/page.jsx:62) and [staff verification](../src/app/actions/adminActions.js:641).

The staff PIN is stored as plain text. The verifier scans one page of the Auth user list to find an email, which is also a future correctness and account-lookup problem. The application has no visible custom throttling for this verifier. A four-digit PIN is unsuitable as unrestricted remote authentication.

Use individual staff membership or a signed, short-lived, tenant-scoped staff session with narrowly defined actions. Hash any retained PIN, throttle attempts, audit access and provide revocation. A convenience lock can remain a UI feature, but it must not be described as the authorization boundary. Provide a real sign-out on shared devices; the current Lock Screen operation deliberately preserves the owner session.

### P0 Dependency advisories require remediation

The production dependency audit reports affected `next`, `sharp`, `postcss`, `nanoid`, `source-map-js` and `baseline-browser-mapping` packages. The Next.js package is classified critical. The registry currently proposes Next.js 16.4.6 as a nonmajor remediation candidate; determine the supported target at implementation time and update related packages coherently.

Patch and rerun build, lint, permission checks and important workflows. Assess advisory reachability against the actual hosting environment. An advisory involving a Windows production host, an image optimizer, or a particular cache API is not proof that this Vercel deployment is exploitable through that path. Server Actions are used here, making their advisories directly relevant to review. One current primary advisory documents [Server Action denial of service](https://github.com/advisories/GHSA-p3m5-59mp-jv5r).

Do not apply `npm audit fix --force` without reviewing the resulting dependency changes. No dependency or application changes were made during this audit.

### P1 Administrative sessions and uploads need stronger boundaries

Super Admin feature listing and mutation now verify their session, which is a positive change. However, authentication uses one shared environment password, differentiates invalid email from invalid password, has no visible custom throttling or MFA, and creates a 30-day bearer session stored in plain text in the database. The supplied migration creates SuperAdminSession without enabling RLS. The cookie is HttpOnly and production Secure, but SameSite is not explicitly configured. See [superadmin actions](../src/app/actions/adminActions.js:480) and [session migration](../supabase/migrations/01_features_and_billing.sql:48).

Prefer an authenticated administrative identity with MFA, an explicit admin allowlist or role, revocable sessions and an audit trail. Lock down the session table even if it is currently empty. Avoid exposing configuration details through login errors. Expired-session handling also calls a cookie-changing action while session verification can run during rendering; verify that expired sessions redirect cleanly without a render-time cookie mutation error.

Image uploads enforce an 800KB size limit, which is useful, but accept any MIME type beginning with `image/` and retain the supplied extension. There is no action-level owner check, tenant storage path, content decoding, dimension limit, quota or cleanup workflow. Use a narrow set of decoded formats, generated safe extensions, tenant paths and policy checks. Remove superseded/orphaned files safely. No live storage write or arbitrary subscription endpoint test was performed.

## Product workflows that need completion

### P1 Waiter requests can disappear from the operational view

The admin starts with an empty request array and subscribes only to ServiceRequest INSERT events. It never loads already pending requests. A request created before opening the dashboard, while disconnected, or before a refresh can therefore be absent from the current dashboard. It also does not reconcile updates from another staff device. See [request subscription](../src/app/admin/page.js:371).

Resolving a request removes it locally before the database confirms success, without restoring it on failure. That can stop the alert even though the request remains unresolved. The customer gets a temporary success checkmark after insertion, not acknowledgement by a staff member.

Load a durable pending queue on entry and reconnect; reconcile status updates across devices; track requested, acknowledged and resolved states; show age and ownership; preserve failures; and make retries idempotent. Alerting should assist a durable queue rather than replace it.

The public action trusts the submitted cafe ID and table string. It does not verify table existence, tenant entitlement, hasTableService, rate limits or duplicate active requests. Add server validation, bounded table identifiers, per-table/request throttling and deduplication. A signed table QR can prevent arbitrary edits but cannot prove physical presence or prevent replay by itself. Expired push subscriptions should be removed after appropriate provider errors. Subscription registration also needs authenticated tenant scope and uniqueness.

### P1 Background push is implemented but not fully available as a product

The notification-enabling card is commented out in Settings. The push function exists, but a new owner cannot enable it through that card. There is no web app manifest or install guidance in the repository. The service worker does not apply several notification fields sent by the server, including tag and requireInteraction. See [SettingsTab](../src/app/admin/tabs/SettingsTab.js:42), [push setup](../src/app/admin/page.js:416) and [service worker](../public/sw.js).

Reintroduce an intentional enable/test/status flow, document supported devices, handle denied permission and remove expired subscriptions. On iPhone and iPad, Web Push support is associated with installed Home Screen web apps and a user-initiated permission request; verify the actual target OS/browser versions. See [WebKit guidance](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/).

Audio playback can be blocked by browser autoplay rules. Wake Lock is best-effort and does not create background reliability. Test with the actual staff devices, including locked screens, denied permissions and reconnection.

### P1 Billing needs server-owned financial rules

The bill total is calculated in the browser and accepted by the server. The server does not validate positive finite quantities, permitted discounts, delivery amounts, item scope or the relationship between line totals and grand total. Native number input attributes do not enforce these business rules at the API boundary. See [billing calculation](../src/app/admin/tabs/BillingTab.js:79) and [createBill](../src/app/actions/adminActions.js:430).

Money should use integer minor units or a decimal-safe method, with explicit rounding rules. Recompute validated totals on the server and retain a historical item and price snapshot. Define whether owners may override rates and how that decision is recorded.

Changing the displayed unit does not convert a rate or quantity. For example, changing a line priced at ₹450 per kg to 500 g still multiplies 500 by 450. An item with no unit defaults to kg, even when it is a drink or a plate. A free-text label such as Half kg is not a complete variant or unit-conversion model. Either keep quantities tied to the priced portion, or introduce explicit priced variants and supported conversions. See [bill item creation](../src/app/admin/tabs/BillingTab.js:51) and [unit selector](../src/app/admin/tabs/BillingTab.js:254).

`billDate` uses the UTC date while the exported image displays a local date. A deterministic check at 00:30 India time on 25 November produced a saved date of 24 November. Use the tenant's business timezone consistently. See [bill save](../src/app/admin/tabs/BillingTab.js:95).

### P1 Saving and sharing a bill are coupled incorrectly

The bill is saved before PNG generation or sharing. If image generation fails, retrying can create another saved bill. Cancelling native Share triggers the download/WhatsApp fallback. The form is then reset, and History exposes only the amount, timestamp, customer name and delete control; it has no reopen, reprint or share action. See [generate and share](../src/app/admin/tabs/BillingTab.js:82) and [history](../src/app/admin/tabs/BillingTab.js:377).

Separate Save from Export and Share. Persist once with an idempotency key, return the saved document, and allow sharing or printing it repeatedly. Cancellation should keep the saved document available without forcing another channel. Show quotation versus invoice in history, support opening a document, and use a traceable number. Consider voiding finalized invoices rather than deleting them without a record.

The current output has no configured supplier address, GSTIN, tax breakdown or business invoice sequence. It is not sufficient evidence of a GST-compliant invoicing product. Required document details depend on the merchant and transaction; have an accountant confirm the applicable invoice or bill-of-supply design before selling tax compliance. [CBIC invoice rules](https://cbic-gst.gov.in/gst-invoice-rules.html) describe requirements including supplier details and serial numbering.

The implementation is also missing payment status, tender reconciliation, refunds, KOT/order lifecycle, shifts and inventory accounting. These are reasons to narrow the POS claim, not a mandate to build them all for a menu MVP.

### P1 A failed change can still look successful

Stock toggles and item deletions update local state before awaiting the server and do not consistently catch errors or restore state. Banner deletion has a similar problem. Multiple quick writes and stale closures can compound disagreement. See [stock toggle](../src/app/admin/page.js:577), [item deletion](../src/app/admin/page.js:582) and [banner deletion](../src/app/admin/page.js:477).

A restaurant employee may believe an item is sold out when the public menu still offers it. Show saving state, prevent conflicting actions where necessary, use functional state updates, and roll back or refetch on failure. Provide a clear retry. An owner should not need developer tools to know whether the kitchen's availability change saved.

### P1 Errors need useful recovery

`getBills` returns an empty list on database errors, making failure look like no history. `getBanners` does the same. Dashboard initialization logs a failure but can leave an owner in an AUTHENTICATING view when no cafe ID is set. A valid account without a cafe has no useful next step. There are no application-specific route error boundaries. See [getBills](../src/app/actions/adminActions.js:444) and [dashboard load](../src/app/admin/page.js:333).

Distinguish empty, loading, unauthorized and failed states. Offer retry, a support path and a reference for the error. Preserve unsaved bill/item drafts where practical. Add errors and recovery before adding more dashboard tabs.

### P1 Feature flags need consistent enforcement

Catering is checked server-side, while many older premium actions are gated only by UI handlers. Public category highlighting renders from the stored category flag without checking the category_highlight entitlement. Units are displayed whenever present, and the editor additionally bypasses the item_units flag for slugs containing kolar. A disabled feature and a hidden or locked presentation are different concepts. See [public category rendering](../src/app/[slug]/CustomerMenuClient.js:277), [unit editor](../src/app/admin/page.js:123) and [feature actions](../src/app/actions/adminActions.js:349).

Define entitlements once and enforce them in the server use case. Keep presentation separate. Decide what happens to existing data when a feature is revoked. Test every feature as enabled, locked, hidden and revoked rather than assuming the dashboard tab is the boundary.

## User experience and interface review

The current direction has useful choices: compact dish cards, prices visible without opening a modal, sticky categories, searchable Malayalam text, a clear catering WhatsApp action and reusable QR links. The catering copy also correctly asks customers to confirm quantities and a final quotation.

The following changes would improve the task more than another animation library or redesign:

| Area | Problem or concern | Improvement |
| --- | --- | --- |
| Identity | Outlet location is hardcoded to Malappuram, and the icon is generic | Store the merchant's location, logo and contact details; present consistent Tencio/MenuHub branding |
| Readability | Many texts are 9–12px, descriptions use light gray, and names can be truncated | Make key food information readable; allow full names or a usable detail view; measure contrast and text zoom |
| Search | Search is behind an icon; closing it does not clear its active query; search remains constrained by the active category | Keep active filtering visible and provide Clear search / All categories recovery |
| Categories | Categories with no visible outlet dishes can remain selectable; highlighted selected and unselected categories share styling | Avoid dead ends and show selection independently from promotion |
| Food decisions | No structured veg/non-veg, allergen, spice or dietary fields exist despite some README claims | Add merchant-maintained tags appropriate to the target customers; do not imply medical safety from an icon |
| Empty menu | No items found does not distinguish an empty menu, a filter mismatch or all dishes unavailable | Provide specific explanations and the next action |
| Menu images | Plain images have no lazy-loading attributes, optimized variants or robust broken-image fallback | Use correctly sized compressed assets and a good no-photo presentation; preserve layout dimensions |
| Catering | An enquiry starts from the catalog, but minimum order, lead time, serving guidance and service area are absent | Add the details that recurring client questions justify; use optional fields rather than mandatory complexity |
| Staff workflow | Stock changes, connectivity and outstanding requests have limited persistent status | Show whether changes saved, when data refreshed and what still needs attention |
| Desktop use | The admin is constrained to a 414px phone frame even on a large display | Retain mobile usability while giving billing and menu management room on laptops |
| Merchant setup | Images over 800KB are rejected and the owner must compress them | Resize/compress safely in the upload workflow, with an informative preview |

These are source-based design assessments. Actual task completion, visual balance, contrast ratios and touch accuracy still need direct device testing.

Accessibility has concrete implementation gaps. The shared ToggleSwitch and Super Admin toggles are clickable divs without native keyboard behavior or exposed switch state. Several edit/delete/add icon buttons have no accessible name. Many labels lack input association. Modals lack dialog semantics, focus management and an Escape path. Category selection is not announced as a pressed or selected state. Autoplay banners have no visible pause control, and motion preferences are not explicitly handled. See [ToggleSwitch](../src/app/admin/tabs/ToggleSwitch.js), [item controls](../src/app/admin/tabs/ItemsTab.js) and [admin modals](../src/app/admin/page.js:92).

Use semantic buttons/inputs first, then add the necessary state and focus management. W3C requires a keyboard equivalent for applicable pointer actions. Target sizing also needs measurement: WCAG 2.2's minimum is generally 24 by 24 CSS pixels with specified exceptions; a 44px product target is a useful more generous touch goal. See [keyboard guidance](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html) and [target size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

For a local diner, test five practical questions: Can I read a long dish name? Can I understand a portion price? Can I identify food restrictions? Can I recover on poor mobile data? Does a service button tell me what happens next? These are more meaningful than asking whether the interface looks modern.

## Architecture maintainability and scaling

Next.js App Router, PostgreSQL and Supabase remain a reasonable stack. This project does not need microservices, Kubernetes, a message broker or a framework migration merely to look senior. It needs clearer boundaries within the existing application.

`admin/page.js` is 766 lines and owns authentication, data loading, upload behavior, form state, billing navigation, QR generation, notifications and modals. `adminActions.js` is 656 lines and combines public reads, privileged writes, authentication, billing and push delivery. The extracted tabs help, but substantial behavior remains in the parent component.

Use a small domain structure: authentication and membership; menu management; public menu projection; catering; billing; service requests; platform administration. Keep server-only data access separate from client UI and add a server-only import guard to privileged modules. Introduce runtime schemas for external inputs. Incrementally type the domain boundaries and money structures. The current source is JavaScript/JSX; a tsconfig with allowJs and strict disabled does not make it a TypeScript implementation.

The migration set cannot recreate the application from an empty database. It references Cafe, MenuItem, Category, ServiceRequest and PushSubscriptions without supplying their original definitions. The PIN RPC, complete policies, indexes, constraints, triggers, storage setup and Realtime publications are also absent. That prevents a reviewer from reproducing or independently certifying the system. Export a reviewed baseline without client data, supply seed fixtures and test a clean install. Do not equate a documentation instruction to run migrations with a verified clean bootstrap.

New tenants currently depend on manual provisioning, and the dashboard uses `cafes[0]`. This is multi-tenant routing, but not a completed multi-outlet account experience. Manual provisioning is acceptable for a managed MVP if it has a repeatable checklist and rollback. A branch switcher is only necessary if the target buyers actually need it.

The public loader makes roughly four to six database requests per refresh, depending on mode and banners. Every browser subscribes to database changes and refetches the public snapshot. With 1,000 active viewers, one edit could therefore trigger approximately 4,000–6,000 application-level database requests, plus Realtime work. This is an illustrative fanout calculation, not a measured capacity limit. React cache deduplicates a render's reads; it is not a shared cross-user menu cache. See [public loader](../src/lib/publicMenu.mjs) and [refresh subscription](../src/app/[slug]/CustomerMenuClient.js:39).

For growth, benchmark representative tenants and consider cached/versioned public snapshots with tenant-specific invalidation. Realtime should carry a safe public signal or projection, not require anonymous access to private Cafe columns. Supabase documents per-subscriber authorization and ordering limits for [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes).

Inspect actual query plans and indexes before tuning: slug lookup; membership/owner lookup; cafe plus menu ordering; bill history by cafe and creation time; pending requests by cafe/status; and unique subscription endpoints within a tenant. Add pagination to bill history and platform tenant lists. Avoid adding indexes blindly without checking existing constraints and workloads.

The client silently tolerates a failed Realtime connection unless a refresh itself errors. Focus-triggered refresh helps, but a visible connection status and bounded fallback strategy would make the promise clearer. Test revocation, deletes and reconnects against actual Supabase RLS/publication behavior, which the fixture does not implement.

No performance score is claimed. Measure a production build with representative photos and menu sizes on a modest Android phone and constrained network. Useful field targets are LCP at or below 2.5s, INP at or below 200ms and CLS at or below 0.1 at the relevant percentile; lab checks alone do not establish field performance. See [Google's Core Web Vitals guidance](https://web.dev/articles/defining-core-web-vitals-thresholds).

Operational readiness also needs error monitoring with sensitive-data scrubbing, uptime checks, a migration/release checklist, spend alerts, documented backup retention and an actual restore drill. None can be certified from the supplied code. Confirm service-plan entitlements before promising an RPO, RTO or SLA. A support number and an export/exit path are business features as well as operational safeguards.

## QA and testing plan

The current fixture tests are valuable but implement selected HTTP behavior rather than PostgreSQL RLS, storage, Realtime or platform constraints. An assertion that a query includes cafeId does not demonstrate that another caller cannot query a different cafe. No automated coverage was found for the full billing workflow, staff authorization, request recovery or real notification delivery.

| Test area | Required examples | Completion evidence |
| --- | --- | --- |
| Database permissions | Anonymous, owner A, owner B, staff A and Super Admin against relevant reads and writes | Real local/staging Supabase or SQL policy tests; sensitive anonymous access denied |
| Action authorization | Forged tenant ID, another tenant's item ID, changed role, expired/revoked session, disabled feature | All protected actions reject the caller independently of the UI |
| Staff access | Fresh-device login; only stock permission; revoked PIN/session; shared-device sign-out | Valid signed staff context and forbidden owner actions |
| Menu management | Create/edit/hide/delete, failed save, repeated click, concurrent staff update | Persisted state and public view agree after success and failure |
| Menu visibility | Hidden category; outlet stock; catering stock independence; feature revocation | Both serialized data and rendered UI follow the intended policy |
| Money | Decimal rates, fractional portions, unit changes, zero/negative/NaN quantities, excessive discounts | Server rejects invalid input and returns consistent rounded totals |
| Billing persistence | Share cancellation, PNG failure, retry, double click, reopen/reprint, history failure | One saved document, recoverable exports and useful error states |
| Business dates | India midnight, another tenant timezone, saved versus printed date | Same intended business date throughout |
| Service queue | Request before dashboard opens, refresh, reconnect, two staff devices, failed resolution | No pending request disappears; staff see consistent status |
| Abuse controls | Replayed request, invalid table, disabled service, repeated PIN attempts, subscription flooding | Bounded requests, denied invalid operations, observable limits |
| Browser/device | Chrome Android, Safari iPhone, desktop; actual staff devices | QR scan, clipboard, WhatsApp link/file sharing, denied push and background behavior checked |
| Accessibility | Keyboard-only controls, focus, accessible names, 200% zoom, screen reader, reduced motion | Critical tasks work without a pointer and remain readable |
| Network | Slow initial load, offline change, reconnect, stale menu, unavailable backend | Honest status and recovery; no false saved state |
| Performance | Realistic image sizes, catalog sizes and concurrent viewers in nonproduction | Recorded latency, errors, query count and cost rather than an invented scale claim |
| Release | Clean database setup, migration, smoke checks, restore and rollback rehearsal | Repeatable release checklist and recorded outcomes |

Add CI for dependency installation, source lint, tests and build. Integrate the disposable route checks if practical. Fix the generated-directory lint exclusion so the documented lint command works after using the preview. Use targeted meaningful tests for permission boundaries, money and failure recovery; do not chase a coverage percentage by duplicating trivial component implementation details.

## Business analyst and CEO review

Two clients show that the project has reached real conversations and some adoption. They do not establish willingness to pay at a sustainable price, repeatable acquisition or retention. The next research should determine which daily or weekly outcome those clients actually obtain.

The full customer journey currently has gaps:

| Stage | What exists | What is missing or weak |
| --- | --- | --- |
| Discover | Public marketing page | Specific buyer, credible proof, clear offer and an enquiry/demo action |
| Start | Vendor login | A new prospect cannot use Get Started to request setup or enter a trial |
| Onboard | Manual database/account setup and admin tools | Repeatable provisioning, content import, merchant checklist and staff training |
| Maintain menu | CRUD, stock toggles, categories and images | Dependable saves, bulk updates, simple image handling and relevant food tags |
| Browse | Public mobile menu and categories | Merchant details, better recovery and verified readability/accessibility |
| Enquire | Catering WhatsApp message with event prompts | Attribution and follow-up tracking; a WhatsApp click is not a confirmed lead or booking |
| Quote/sell | Bill/quotation builder | Document recovery, event/quote lifecycle, safe totals and payment tracking if needed |
| Renew | Feature toggles | Clear commercial terms, measured ongoing value and a consistent renewal process |
| Leave | No visible workflow | Tenant export, deletion/retention policy and continuity of the merchant's QR/link |

There are two plausible businesses. A managed menu service sells setup, Malayalam/local support, content help, QR material and dependable maintenance. A self-service SaaS sells a repeatable workflow with low support cost. At two clients, the first can be a sensible learning and revenue model. Do not invest heavily in self-service subscription automation before proving that customers can get value and that support economics work.

The narrow catering opportunity is worth testing because the code already supports a complete shareable catalog and structured enquiry. Validate whether this reduces repeated menu explanations, quote preparation or missed enquiries. Do not assume catering customers will pay more without interviews and paid trials.

Measure support and setup time. An illustrative ₹499 monthly fee minus ₹100 allocated hosting and 45 minutes of support valued at ₹500/hour leaves ₹24 before acquisition costs, payment fees and taxes. Those are assumptions, not measured project economics. The example shows why underpricing an assisted service can be worse than having few clients.

Calculate contribution per merchant as revenue minus allocated infrastructure, fees, support and onboarding amortization. Calculate acquisition cost including the founder's sales time. With only two accounts, track actual renewals and contribution rather than estimating a confident lifetime value from a tiny sample.

## Market and competitor research

Current first-party product pages show that generic QR menus and realtime price updates are common. Feature count alone is a weak reason to buy Tencio.

| Alternative | What its public offer establishes | Implication for Tencio |
| --- | --- | --- |
| Printed menu, PDF or WhatsApp image | A familiar, inexpensive substitute; no new dashboard for the owner | Explain the practical benefit of keeping availability/current pricing accurate |
| MenuQR | Its free plan advertises a permanent QR and up to 40 dishes, with sold-out/diet/allergen support | A permanent QR by itself is not a durable differentiator. [MenuQR pricing](https://getmenuqr.app/en/pricing/) |
| MenusQR | Advertises monthly tiers of ₹199, ₹299 and ₹899; higher tiers include portion variants and ordering | Expect price pressure and compare actual included service, limits and support. [MenusQR plans](https://menusqr.in/plans) |
| Petpooja | Advertises table scanning, ordering, payment and KOT delivery into its POS | Tencio should not imply equivalent POS integration or ordering coverage. [Petpooja Scan and Order](https://www.petpooja.com/poss/scan-and-order) |
| Dotpe | Advertises restaurant POS, kitchen displays, QR ordering, payments and other operational tools | A broad restaurant operating-system claim invites comparison with a much wider workflow. [Dotpe](https://www.dotpe.in/) |

These are vendor-advertised capabilities and prices checked for this audit, not hands-on competitor QA, customer satisfaction findings or guaranteed final quotes. Do not infer that a cheap listed menu plan has the same onboarding or support economics as a managed Tencio service.

A defensible initial advantage would be specific service quality for a reachable group: accurate local-language content, quick setup, good photos, easy availability management, helpful merchant support and a catering enquiry/quote flow that fits their work. These are hypotheses to validate with owners, not a proven moat. A meaningful long-term advantage would require repeated usage, distribution, merchant relationships or a workflow competitors serve poorly.

## Digital marketing and sales plan

Replace the current broad headline with a promise the product can demonstrate, such as: Keep your restaurant menu current and share your catering menu on WhatsApp. Make the next step View demo or Book menu setup. Keep Vendor Login for existing clients. The current Get Started link opens the login screen, which does not help an unregistered buyer. See [landing page](../src/app/page.js).

Use two focused examples: a cafe showing live availability, and a caterer sharing a full event catalog. Show a real anonymized admin change alongside the customer result. State exactly what is included in setup and ongoing support. Add a contact path, clear prices or a transparent quote process, FAQs, privacy/terms information and permissioned customer proof. Avoid operating system, comprehensive POS, guaranteed instant or revenue uplift claims that the evidence does not support.

The early acquisition plan should favor learning over ad spend:

1. Observe each existing client performing its real work. Record the task, frequency, mistakes, current substitute and outcome. Ask what would make them stop paying.
2. Improve the most common failure that blocks that task. Obtain a renewal or a paid continuation under explicit terms.
3. Build a qualified list of approximately 15–20 nearby businesses matching that use case. Use individual outreach and short demonstrations; do not run bulk WhatsApp messaging.
4. Offer a bounded pilot with agreed success criteria and a visible post-pilot price. Keep setup assistance and unlimited custom development distinct.
5. Track qualified conversation, demo, activation, paid conversion and renewal. Repeat the segment that produces low support effort and sustained usage.
6. Ask satisfied merchants for an introduction. Partner with a local designer, photographer or print supplier only if the combined service remains profitable.

Test packaging rather than claiming a researched price. One possible experiment is ₹1,500–₹3,000 for assisted setup plus ₹499–₹799 monthly for a clearly bounded menu service. Another is an annual maintenance offer when ongoing usage is low. These are proposed interview/trial prices, not market valuations. Quote taxes, printing, custom domains and extra content work transparently. Compare the result with the cheap menu alternatives and the actual support time.

For catering, place the menu link where event buyers already discover the business: its own website, an appropriate Google Business Profile link, Instagram profile, printed materials and merchant-controlled WhatsApp sharing. Instrument source-tagged links without putting customer details in URLs. Respect platform rules and the merchant's consent when using its identity or customer information.

Useful product metrics are menu publication, first owner update, QR scans or menu visits, stock-update success, returning merchant activity, catering CTA clicks, qualified enquiries confirmed by the merchant, quote preparation time and renewal. A WhatsApp click is only an intent signal. Track failed saves and missed/aged service requests as reliability metrics. Do not collect diner phone numbers merely to prove analytics.

Public SEO needs a real 404 for unknown outlet slugs, merchant-specific canonical metadata, useful merchant details and a deliberate indexing policy. Catering has a canonical URL; ordinary outlet pages do not. There is no supplied sitemap or robots route, and login/admin pages have no explicit noindex metadata. Customize social previews to the merchant where useful. Local search demand and customer outcomes need testing; a sitemap alone will not create demand.

## Portfolio LinkedIn and recruiter review

This can be a strong portfolio project because it connects engineering choices to actual merchant workflows. Its value will come from demonstrable correctness and thoughtful limits, not from claiming every SaaS capability.

The README currently describes Next.js 15 while package.json uses 16.2.7. It presents TypeScript, ordering, branch management, modifiers, dietary/spice badges, bottom-sheet item drawers and Request Bill behavior that are not established by the reviewed implementation. Feature toggles do not constitute a complete subscription lifecycle. The clone example wraps its URL in Markdown syntax inside a shell command. It claims an MIT license, but no LICENSE file was found. See [README](../README.md).

Correct those claims before sending the repository to recruiters. Describe JavaScript accurately unless meaningful types are actually introduced. Describe the system as a multi-tenant menu platform with a limited quotation module, and list planned features separately from delivered ones. Do not advertise secure tenant isolation until the actual permission checks pass.

A credible case study should include:

- The client problem, target user and constraints, with permission to identify the client or use its logo/testimonial.
- A small architecture diagram explaining public projection, authenticated writes, tenant policies, Realtime and the external WhatsApp handoff.
- Actual screenshots and a 60–90 second walkthrough: owner changes stock, public menu updates, catering still shows the full catalog, an enquiry opens, and a quotation can be recovered.
- An isolated seeded demo with no real customer records, staff PINs or privileged keys. Any public demo access must be deliberately restricted to disposable data.
- A reproducible clean setup and CI evidence, including negative permission tests and financial edge cases.
- Measured results with dates and methods. If no business lift was measured, say what was delivered and validated without inventing percentages.
- One or two tradeoffs: why a shared catalog, why WhatsApp handoff, why a monolith and why server-owned authorization.
- A limitations section and a short roadmap that show engineering judgment.

A suitable LinkedIn narrative after hardening is: Built a digital menu platform for two local clients, learned where staff convenience conflicts with authorization, implemented tested tenant boundaries, and improved the real menu-to-enquiry workflow. Include only the outcomes that are then true. Do not publish exploit details or client data as portfolio material while a live weakness remains unresolved.

## Recommended MVP boundary

Keep these as the initial reliable offer: merchant setup, categories/items/prices/portion labels, correct availability and visibility, a readable mobile menu, stable QR links, a shareable catering catalog, a contact/enquiry handoff, safe owner/staff permissions, basic exports/support and reliable saves.

Complete quotation/receipt behavior only to the depth the paying clients need. Keep table service as a controlled pilot until its queue, notifications and recovery pass real-device checks. Manual commercial invoicing of Tencio's own subscription customers is acceptable initially; it is separate from the restaurant's customer-bill feature.

Delay native apps, AI recommendations, full inventory, loyalty, delivery aggregation, multi-branch management, payment gateways and complex subscription automation until the customer evidence justifies them. A required allergy label or portion model for current clients can be more important than any of those bigger features.

## Prioritized implementation roadmap

The sequence below is a planning estimate. Calendar time depends on founder availability and the actual database configuration; use acceptance gates rather than promised dates.

| Order | Work | Effort | Acceptance gate |
| --- | --- | --- | --- |
| 1 | Contain anonymous sensitive-data access; inspect grants/policies and deployment targets | Medium, urgent | Anonymous sensitive reads denied without breaking public menu access |
| 2 | Introduce request-scoped identity, tenant membership and server authorization on all protected actions | Large | Anonymous and cross-tenant reads/writes denied in real policy/action tests |
| 3 | Replace browser-only staff permissions; hash/revoke credentials; add real sign-out and throttling | Large | Fresh-device staff login works and owner-only actions remain forbidden |
| 4 | Patch dependencies and align configuration | Medium | Reviewed production audit findings cleared or specifically mitigated; checks pass |
| 5 | Restore complete schema, policies, storage and publication setup to version control | Medium | A clean environment can be created and tested without private production data |
| 6 | Fix failed-save recovery and durable service queue | Medium | Refresh/reconnect/failure does not hide unsaved changes or pending requests |
| 7 | Correct bill units, dates, server totals and save/export lifecycle | Large | Invalid financial input rejected and one document survives retry/share cancellation |
| 8 | Fix source lint workflow, add CI and focused integration/end-to-end coverage | Medium | The documented checks pass from a clean checkout and after preview use |
| 9 | Improve readability, accessibility, owner setup and merchant information | Medium | Observed users complete their tasks on target devices, including keyboard checks |
| 10 | Correct landing page and README, add demo, proof and bounded offer | Medium | A new prospect can understand, try and enquire without an existing account |
| 11 | Benchmark menu refresh and implement caching/index changes justified by data | Medium | Measured performance and cost meet an explicitly chosen target |
| 12 | Run a small paid validation cycle and document the case study | Ongoing | Retained use, acceptable support effort and honest evidence of customer value |

For a roughly four-week focused pass, concentrate the first phase on containment and authorization, the second on workflow correctness and tests, the third on usability and operations, and the fourth on evidence, positioning and a small sales experiment. Complex authentication/schema recovery can extend that schedule; reduce optional scope instead of skipping the security gate.

Before broad marketing, require: no anonymous sensitive access; real owner/staff tenant enforcement; remediated dependency findings; repeatable setup; reliable critical saves; a tested service queue if advertised; correct and recoverable billing if advertised; tested backups/restoration appropriate to the promise; and real-device QR/sharing checks. Do not treat a green build as a substitute for those outcomes.

The business decision after this pass should use concrete client evidence: What gets used? What do clients pay? Do they renew? How much support does each require? Which task became materially easier? Those answers determine whether to expand a managed service, invest in self-service SaaS, or retain this as a well-documented engineering portfolio project.
