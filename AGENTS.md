# AGENTS.md — Legacy Vault / Legacyshop

Project memory for coding agents. Read this first; it is meant to save you a full
re-exploration of the repo. Keep it updated when you learn something durable.
Scope: whole repository (repo root).

---

## 1. What this is

A Laravel 12 + Inertia 2 + React 19 e-commerce app ("Legacy Vault") with two faces
in one codebase:

- **Storefront** — public shop (home, product list/detail, cart, checkout, articles,
  about, user account settings). Product prices are in **IDR** for Indonesian
  visitors and **USD** for everyone else; the currency/payment rail is chosen by
  **GeoIP**, not by a user setting.
- **Admin dashboard** — CRUD for products, categories, sub-categories, divisions,
  variants, units, tags, warehouses, vouchers, events, banners, running text,
  testimonials, referrals, articles, orders, invoices, international shipments.

Payments: **Midtrans Snap** (Indonesia/IDR) and **PayPal** (international/USD).
Shipping: **Biteship**. Auth: **AWS Cognito** (wrapped in a Laravel session login).
Storage: **AWS S3** (+ optional CDN). PDFs: dompdf. Barcodes: milon/barcode.

## 2. Stack & commands

| Area | Choice |
| --- | --- |
| Backend | PHP 8.4, Laravel 12.24, Inertia 2, Ziggy 2 |
| Frontend | React 19, TypeScript (strict), Vite 7, Tailwind CSS **v4** |
| UI kit | shadcn/ui (Radix primitives) in `resources/js/components/ui/` |
| DB | MySQL 8 (prod + local `.env`); SQLite in-memory for tests |
| Cache/session/queue | Redis (cache+session), database queue |
| Tests | PHPUnit 11 (`phpunit.xml`), 2 suites: Unit, Feature |
| Format/lint | Pint (PHP, no `pint.json` → defaults), Prettier + ESLint (JS/TS) |

```bash
composer dev        # serve + queue:listen + vite (concurrently)
composer dev:ssr    # above + pail logs + inertia:start-ssr
npm run dev         # vite only
npm run build       # client build
npm run build:ssr   # client + SSR builds (needed for SSR to work)
npm run types       # tsc --noEmit          (use before declaring TS work done)
npm run lint        # eslint . --fix
npm run format      # prettier --write resources/
./vendor/bin/pint   # PHP formatting
composer test       # config:clear + php artisan test
php artisan test --filter=SomeTest
php artisan indo:import --dir=<dir>   # import Indonesia region CSVs (prov/kabkota/kec/desakel)
```

Node used locally: v24 (CI pins 22). CI workflows (`.github/workflows/`) run
`phpunit` + Pint/Prettier/ESLint, but they are triggered on `develop`/`main`
**which do not exist** — real branches are `main`, `staging`, `production-railway*`.
So CI does **not** gate the branches anyone actually pushes to. Verify yourself.

## 3. Repo map

```
app/
  Console/Commands/IndonesiaGeoImport.php   # indo:import
  Http/Controllers/API/V1/                 # almost all logic lives here
    ProductController   (2587 lines)        # products, groups, categories, units,
                                            # sub-units, tags, types, pricing map
    OrderController     (1821 lines)        # checkout (Midtrans+PayPal), capture,
                                            # webhooks, confirm/cancel, reopen payment
    MiscController      (1158 lines)        # running text, banner, voucher, event,
                                            # testimonial, referral
    ViewController      (699 lines)         # every Inertia page render (both faces)
    InvoiceController   (787 lines)         # invoices + PDF download
    LocationController, CartsController, UserController, SummaryController (dashboard),
    BiteshipController, WarehouseController, DivisionController, SubCategoryController,
    VariantController, ArticleController, LocationController, NotificationController,
    AWSCognitoAuthController, InternationalShipment
  Http/Controllers/OrderHistoryController.php
  Http/Middleware/  EnsureTokenIsValid, RoleMiddleware, HandleInertiaRequests,
                    HandleAppearance, SetLocale
  Http/Traits/      AuthoritativePricingTrait, AwsS3, Cognito, GeoIpTrait
  Jobs/ExpirePendingOrdersJob.php           # scheduled every 15 min
  Mail/OrderConfirmedMail, OrderShippedMail  # mailable → plain-text templates
  Models/           43 Eloquent models (see §6)
resources/js/
  app.tsx, ssr.tsx                          # client + SSR Inertia entries
  pages/                                    # one file per Inertia component
    front/{products,carts,checkout,articles,about-us}/
    products/{category,subcategory,division,variant,unit,subunits,tags,product}/
    orders/{,invoice,summary}/, shipment/international/, warehouse/, referral/,
    misc/, articles/, settings/{,delivery-address,purchases}/, profile/, auth/
    welcome.tsx, dashboard.tsx
  components/        app-sidebar (admin nav), dialog-handler, product-card, ui/*
  contexts/          CartContext, SearchBarContext
  layouts/           app/ (admin shell), auth/, front/ (storefront), settings/
  types/index.d.ts   # ALL shared prop + entity types (large, single file)
resources/views/app.blade.php               # Inertia root template
resources/views/pdf/{invoice,shipping-label}.blade.php
resources/views/emails/*_plain.blade.php
routes/web.php       # ~530 lines: API-ish JSON routes AND Inertia page routes
routes/api.php       # only the two payment webhooks
routes/console.php   # schedules ExpirePendingOrdersJob
```

### Routes: two route families in `routes/web.php`

There is **no separate API route file of substance** — `routes/api.php` only holds
webhooks. Everything else is in `web.php`:

- `v1/...` — JSON endpoints (public subset + `ensureToken` + `ensureToken,role:admin`).
  Checkout webhooks live under `api.php`: `POST v1/notification` (Midtrans),
  `POST v1/paypal/notification`.
- Bare paths (`/`, `/dashboard`, `/products/...`, `/orders/...`, `/settings/...`) —
  Inertia page routes, always rendered through `ViewController`.
- `/dev/shipping-label-preview` and `/dev/shipping-label-pdf` — **unauthenticated
  debug routes** that render/stream a shipping label with hardcoded data. They are
  reachable in production; treat as existing tech debt, don't build on them.

`ViewController` is a **facade over the other controllers**: it `new`s them in its
constructor and calls their methods to assemble Inertia props. It does not contain
the query logic itself. Note `new UserController($request)` (needs the request)
while the others take no arguments.

## 4. Auth & authorization (read this before touching anything user-scoped)

Auth is **Cognito-backed but session-based**:

1. `POST /v1/cognito/login` (`AWSCognitoAuthController::login`) calls Cognito
   `initiateAuth`, then `Auth::attempt($email, $password)` against **local
   `users.password`**, then stores `auth_token` + `refresh_token` on the user model
   and `Auth::login($user)`.
2. `ensureToken` middleware (`EnsureTokenIsValid`) gates every protected route:
   - requires a logged-in user with a non-null `auth_token`;
   - enforces a **7-day idle timeout** via the `sessions` table `last_activity`;
   - validates the Cognito access token and **silently refreshes** it with the
     refresh token when expired, persisting the new token;
   - on any failure: clears tokens, `Auth::logout()`, redirect to `login`.
3. `role:admin` (`RoleMiddleware`) requires `users.role === 'admin'`; a mismatch
   wipes the tokens and logs the user out.

Consequences:

- Local password is used for the Laravel session even though Cognito is the IdP.
  Google/social `callback()` is **broken/placeholder** (hardcoded
  `https://<your-domain>.auth...` URL and a `firstOrCreate` with a `name` column
  that `users` doesn't have). Don't rely on it.
- `HandleInertiaRequests` shares `auth.user` = `{id, name, email, role, country}`
  where `name` and `country` come from the **`profile` table**, not `users`.
  It also shares a Cognito `accessToken` to the frontend **only for admins**
  (used to call an external API from the browser); non-admins get `null`.
- Shared props also include: `ziggy`, `locale` (from `AppServiceProvider`),
  `sidebarOpen` (cookie), `flash.alert`, plus `quote`/`name`.
- Locale: `SetLocale` reads `session('locale')`, else the first 2 chars of
  `Accept-Language`; only `en` and `id` exist (`lang/{en,id}/{HeaderTrans,WelcomeTrans}.php`).
  Switch via `GET /lang/{lang}`.

## 5. The money path (highest-risk area — read carefully)

### GeoIP gates the currency and the payment rail
`GeoIpTrait::resolveCountryCodeFromIp()` decides `isIndonesian`. Rules baked in:
never trust `X-Forwarded-For` directly (use `$request->ip()` with trusted proxies),
always set an HTTP timeout, always cache the lookup (ip-api.com free quota).
`isIndonesian === true` → IDR + Midtrans; `false` → USD + PayPal.

### Checkout is two nearly-duplicate endpoints
`OrderController::checkout` (Midtrans/IDR) and `checkoutPaypal` (USD) are large,
largely copy-pasted flows: validate → `DB::beginTransaction()` → create/update
guest or user → decrement stock → create order + items + shipment → create
payment → `DB::commit()` (rollback on exception). They reject the wrong region
with a 500. **If you change one, check whether the other needs the same change.**

### Prices are recomputed server-side — keep it that way
`AuthoritativePricingTrait::resolveAuthoritativeItemPrice()` rebuilds the true
unit price from product/sub-category/division/variant fields and discount rules
(mirroring `Carts::resolvePriceForCurrency()`). The request's `items.*.price` is
**validated but must not be trusted**: there is a documented past exploit where a
USD-priced numeral was submitted as IDR. Any new checkout/pricing code must
recompute from the DB.

### Cart pricing model (memorize the shape)
A cart line is a **composite selection**: `product_id` + optional
`category_id`/`sub_category_id`/`division_id`/`variant_id`, each of which *adds*
its own price on top of the product price, with its own discount rules:
- `product_discount` (percent) on the product price, or the active event's
  `discount` (event wins over the product discount).
- pivot tables (`product_sub_category`, `product_division`, `product_variant`)
  carry `use_*_discount` + `manual_discount` per product and per option.
- `Carts::MAX_CART_ITEMS = 100` caps distinct lines; mirrored in the frontend as
  `MAX_CART_ITEMS` in `resources/js/contexts/CartContext.tsx` — **keep both in sync**.

### Order numbers & webhooks
`Order::boot()` generates `order_number` as `ORDERWEBSITE` + zero-padded counter
using `lockForUpdate()` — this only works inside a transaction, so don't create
orders outside one. Webhooks: Midtrans `POST /api/v1/notification`
(`handleNotification`) and PayPal `POST /api/v1/paypal/notification`
(`handlePaypalExpire`). `ExpirePendingOrdersJob` (every 15 min) expires
`awaiting_payment`+`pending` orders older than 3 hours, **restores stock** to
product/sub-category/division/variant, and restores a limited voucher.

### CSRF
`bootstrap/app.php` excludes these from CSRF: `v1/checkout/order`,
`v1/checkout-paypal/order`, `v1/orders/*/capture`, `v1/check-voucher`. The frontend
sends the rest with the `meta[name=csrf-token]` value. Add new exclusions only
deliberately.

## 6. Models & data conventions

- **UUID primary keys** (`HasUuids`) on essentially everything user-facing:
  products, orders, carts, users, invoices, articles, events, referrals, etc.
  Exception: the `indonesia_*` region tables and `VoucherProduct` use auto-increment
  ints. `hasUuids()` order matters: models generate their UUID on `creating`.
- Enum-ish string columns: `users.role` ∈ {user, admin}; `orders.status`,
  `orders.payment_status`, `orders.transaction_status`; `shipment.status`.
- `users` table has **no `name` column** — the display name lives on `profile`
  (`profile.user_id` → users.id, one row per user). Same for `phone`, `country`,
  `date_of_birth`. `Order::customer` = `user ?? guest`.
- Guest checkout writes a `guest` table row (note: table is `guest`, singular).
- Pricing columns exist in IDR and USD pairs: `*_price` / `*_usd_price`.
- `Product` appends `thumbnail_url` + `thumbnail_picture_id` (first picture by
  `sort_order`, then `created_at`).
- `Referral` (added 2026-09) is keyed by `referral_code` string, and `Order` stores
  `referral_code` + `referral_discount` (denormalized, joined by code not FK).
- Heavy use of `with([...])` eager loading and `applyPriceMappingToProduct()` to
  swap IDR/USD before returning to the frontend — follow that pattern.

## 7. Frontend conventions (Inertia + React)

- **Persistent layouts are assigned, not imported**: each page sets
  `PageNamed.layout = (page) => <FrontLayout>{page}</FrontLayout>` at the bottom of
  the file. Storefront pages use `layouts/front/front-layout`, admin pages use
  `layouts/app/*`. Do not wrap layout inline in JSX — it remounts the
  header/footer/cart on every navigation (a bug that was already fixed once).
- **Storefront search**: `FrontHeader` owns the search box. Pages that need to drive
  it call `usePageSearchBar({value, onChange, route, ...})` from
  `@/contexts/SearchBarContext`; don't thread search state through props.
- **Cart**: `CartProvider` (mounted by `FrontLayout`) exposes `useCart()`;
  guest carts persist to `localStorage` (`cart_session`), authenticated carts sync
  to `/v1/carts/*` with a 350 ms debounce on quantity changes.
- **Images**: prefer `thumbnail_url` (≈400 px JPEG, generated on upload by
  `AWS_S3`) and fall back to the full-size `url`; add `loading="lazy"` + `width`/
  `height` on grid/thumbnail images. Deliberately **eager** + full-size: the
  product-detail and article-detail hero images. Banners have no thumbnail.
- **Third-party scripts**: Midtrans/PayPal `<script>` tags in `app.blade.php` render
  only for components listed there (`front/checkout/index`, `settings/purchases/index`,
  `orders/index`, `orders/summary/index`) with `defer`. If you add a page that calls
  `window.snap` or renders a PayPal button, add its component name to that list.
- **Titles/SEO**: use `<Seo>` / Inertia `<Head>`; there is intentionally **no**
  `<title>` in `app.blade.php` (a hardcoded one caused duplicate titles). App name
  in `app.tsx`/`ssr.tsx` is the literal `'Legacy Vault'` and must match between them.
- **SSR**: `resources/js/ssr.tsx` + `resources/noop.ts`; the Vite config aliases
  `@inertiajs/{core,react}/server` to the noop stub **only for the client bundle**
  (aliasing it in the SSR bundle breaks SSR and silently degrades every page to
  client-only rendering — do not "simplify" that conditional). `npm run build:ssr`
  is needed for SSR.
- **Path alias** `@/*` → `resources/js/*` (tsconfig + Vite). `ziggy-js` is aliased
  to `vendor/tightenco/ziggy`; use the global `route()` helper.
- `resources/js/types/index.d.ts` is the single source of shared prop/entity types
  (`SharedData`, `IProduct`, `ICart`, `IOrder`, …). Update it when you change props.

## 8. Images, PDFs, i18n

- `AwsS3` trait: `getS3Client()`, `buildPublicUrl()` (uses `AWS_S3_CDN_URL` when set,
  else `AWS_S3_ENDPOINT` + bucket), `uploadThumbnailToS3()` (~400 px JPEG, wrapped in
  try/catch so a thumbnail failure never blocks the upload), and per-entity
  uploaders returning `{url, thumbnail_url}` (products, units, events, testimonials,
  articles). Thumbnails only apply to **new** uploads; existing rows fall back to the
  full-size URL.
- PDFs: `resources/views/pdf/invoice.blade.php`,
  `resources/views/pdf/shipping-label.blade.php` (barcode via `Milon\Barcode\DNS1D`
  → base64 PNG).
- Mailables render plain-text Blade templates in `resources/views/emails/`.
- `MAIL_MAILER=log` locally; check `storage/logs` for mail output in dev.

## 9. Testing — current state (verify before trusting)

`php artisan test` currently fails: **21 failed, 5 passed**. Root cause is
scaffold drift, not a regression you introduced: the default Laravel `UserFactory`
writes a `name` attribute that the `users` table does not have (names live on
`profile`), and the stock auth/profile tests (`tests/Feature/Auth/*`,
`tests/Feature/Settings/*`) still assume the starter-kit schema
(`Auth::attempt` also needs a local `password`, which exists, but registration/
verification flows don't map to the Cognito design). `tests/Feature/DashboardTest.php`
likewise authenticates via `User::factory()` and hits `/dashboard`, which only
works if the factory matches the UUID/schema shape.

Implication: **there is no reliable automated test signal for business logic.**
When you change backend behavior, verify with targeted manual checks (Tinker,
hitting the route, or a scratch test) rather than assuming the suite covers it.
PHPUnit's sqlite in-memory config means any test you write must migrate first
(`RefreshDatabase`) and must respect the UUID schema.

## 10. Conventions / gotchas to honor

- Controllers are large and pragmatic: try/catch + `Log::error` + `back()->with('alert', …)`
  or JSON `{message, errors}` are the house style. Match the surrounding code
  rather than introducing new abstractions.
- Validation uses `Validator::make(...)` inline in controllers (not FormRequests,
  except `app/Http/Requests/{Auth,Settings}`).
- Migrations are **forward-only in practice**: several "create" migrations guard with
  `Schema::hasTable()` because an earlier run crashed mid-migration. Check history
  before editing an existing migration.
- Migrations through 2026-05 exist; newest wave is the storefront performance work
  (see below) and the 2026-09 referral feature.
- Dates in the repo look "future" (2026) — that's the project timeline, not a typo.
- `.env` is committed and contains real credentials; never print secret values in
  output or commit new secrets. `.env.example` is stale (still `sqlite`/`database`
  drivers, missing Redis/CDN/Cognito/etc.) — prefer reading `.env` for real config.
- `storefront-performance-tracker.md` is a live worklog of the storefront perf audit.
  Items **5, 5b are code-complete but marked `[~]`**, pending manual steps:
  `composer require intervention/image:^3.9` (already in composer.json/lock — verify
  vendor is installed), `php artisan migrate` for the `thumbnail_url` columns, and
  confirming GD is enabled. Item **6** (convert add-to-cart to a plain API call) is
  still open. Read it before doing storefront performance work.
- No `README.md`, no `pint.json`, no `tailwind.config.js` (Tailwind v4 is configured
  entirely through `resources/css/app.css`); `components.json` references the
  missing `tailwind.config.js` — that's fine, shadcn paths still resolve.

## 11. Working agreements for agents on this repo

- Prefer surgical changes; controllers are long and heavily copy-pasted, so mirror
  the existing pattern instead of refactoring neighbors.
- If you touch the money path (checkout, pricing, cart, order webhooks), state
  explicitly what you verified and how — the test suite will not catch regressions there.
- Run `npm run types` after TS changes and `./vendor/bin/pint` after PHP changes.
  `npm run format` / `npm run lint` use `--fix`/`--write` and will rewrite files.
- Don't run `npm install`/`composer install` unless the task needs it (network is
  restricted and needs approval).
- Never run `git commit`, `git push`, or create branches unless asked.
- Keep this file current: if you discover a durable fact (a broken flow, a coupling,
  a manual step), add it under the relevant section rather than burying it in chat.
