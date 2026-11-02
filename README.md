# SafeShelf V1 — Household Pantry & Freshness Ledger

SafeShelf is an editorial, responsive household inventory, expiration tracking, and shopping management application. It is engineered with a vanilla JavaScript frontend (zero frontend frameworks) and an Express.js / Node.js backend with optional MongoDB persistence and Multer file handling.

---

## 1. Project Purpose & Implemented Features

### Product Catalogue
- Bundled 112-product dataset across 10 pantry departments with high-resolution imagery and estimated shelf-life indicators.
- Instant client-side search and category filtering with local dataset fallback when offline.
- Optional external product enrichment via DummyJSON with an in-memory TTL cache (30 minutes) to eliminate redundant outbound latency.
- Strict duplicate suppression when local dataset and external products are merged.

### Inventory Management
- Complete local CRUD (Create, Read, Update, Delete) for pantry provisions.
- Form validation: required name, maximum 100 characters, category selection, numeric/unit quantity checks, and ISO date formatting.
- Expiration date suggestion engine based on category norms.
- Empty states, quantity editing, and real-time dashboard total updates.
- Offline-first local persistence via browser `localStorage` with explicit cloud synchronization state indicators (`☁️ Synced`, `☁️ Syncing…`, `☁️ Offline`, `⚠️ Conflict`, `⚠️ Sync error`).

### Shopping List & Automation
- Manual quick-add, quantity adjustment, and item removal.
- Low-stock auto-detection (items $\le$ 1 unit or out of stock automatically generate shopping entries).
- Purchased checkbox toggling with strikethrough styling and reversal.
- "Clear Completed" action with automatic low-stock suppression until inventory is replenished.
- Dedicated print stylesheet (`@media print`) for hardcopy shopping lists.

### Expiry Tracker & Warranty Ledger
- Expiry tracker grouping provisions into Urgent ($\le$ 3 days), Upcoming (4–7 days), and Safe (> 7 days).
- Dedicated Warranty Ledger tracking appliances and household electronics with countdowns and active/expiring/expired badges.

### Analytics & Notifications
- Dynamic dashboard metrics (Total Provisions, Expiring Soon, Low Stock, Expired).
- Segmented category distribution breakdown and freshness health gauges.
- Dismissible notification center with user-scoped dismissal persistence.

### Input, Import & Backup
- **Multer CSV Shopping Import (`/api/shopping-import/preview`):** Streaming in-memory parser supporting RFC 4180 quotes, BOM removal, header mapping, control character rejection, and a strict 500-row limit (HTTP 413).
- **Multer Image Uploads (`/api/uploads/image`):** Binary magic-byte inspection for JPEG (`FF D8 FF`), PNG (`89 50 4E 47`), and WebP (`RIFF`...`WEBP`), with a 5 MB file size limit and UUID filename generation.
- **Backup & Restore:** Full JSON export and schema-validated restore with user confirmation modal.

---

## 2. Technology Stack

- **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3 with CSS Custom Properties (Theme tokens). No React or build tools required.
- **Backend:** Node.js (v18.17+ / v20+ / v24+), Express.js 4.21.
- **Security & Middleware:** Helmet 8 (Content Security Policy, `nosniff`, `frame-ancestors 'self'`), `express-rate-limit`, `multer` (in-memory buffering).
- **Authentication & Concurrency:** HMAC-SHA256 JWT (`jsonwebtoken`), `bcryptjs`, Optimistic Concurrency Control (OCC) with integer version tracking.
- **Database (Optional):** MongoDB / Mongoose 8.9 (application operates in local-first mode when MongoDB is offline).
- **Testing:** Playwright for browser testing, native Node.js test harnesses.

---

## 3. Project Directory Structure

```text
SafeShelf-V1/
├── css/
│   └── styles.css                    # Main design tokens and responsive stylesheet
├── data/
│   ├── products.json                 # 112-product local catalogue dataset
│   ├── category-summary.json         # Category mapping summary (10 categories)
│   ├── CATEGORY-README.md            # Dataset documentation
│   └── products-by-category/         # Departmental JSON datasets
├── dataset_assets/                   # 112 bundled high-resolution product photos
├── images/                           # Built-in pantry thumbnail images
├── js/
│   ├── config.js                     # HTML entity escaping & safe URL sanitizers
│   ├── auth.js                       # AuthModule, StorageModule (OCC & sync), modals
│   ├── inventory.js                  # InventoryModule & CatalogStore
│   ├── features.js                   # ShoppingListModule & quick-add workflows
│   ├── dashboard.js                  # Metrics, expiry tracker, warranties, notifications
│   ├── dataset-catalog.js            # Offline catalogue loader and API merge logic
│   └── shopping-import.js            # CSV file upload and preview modal integration
├── server/
│   ├── middleware/
│   │   └── auth.js                   # JWT verification & MongoDB ObjectId validator
│   ├── models/
│   │   ├── Product.js                # Product catalogue Mongoose schema
│   │   ├── User.js                   # User account schema with bcrypt password hashing
│   │   └── UserData.js               # Multi-tenant user inventory & versioned storage schema
│   └── routes/
│       ├── auth.js                   # Register, login, profile endpoints
│       ├── products.js               # Catalogue listing, categories, and caching
│       ├── shoppingImport.js         # Multer CSV streaming preview endpoint
│       ├── uploads.js                # Multer image upload with magic-byte verification
│       └── userData.js               # Versioned user cloud persistence with OCC
├── scripts/
│   ├── test-non-db-features.js       # Independent non-database feature test suite
│   ├── test-batch2-concurrency.js    # Concurrency, OCC, and logout safety tests
│   ├── test-db-resilience.js         # Database offline resilience test suite
│   ├── qa-api-security-tests.js      # Backend API and live MongoDB integration tests
│   ├── qa-browser-tests.js           # Playwright browser end-to-end test suite
│   ├── find-404s.js                  # Missing asset detection script
│   ├── import-products.js            # Script to seed catalogue into MongoDB
│   ├── seed-demo.js                  # Script to seed demo account into MongoDB
│   └── live-demo.js                  # Automated interactive live demo script
├── uploads/
│   └── .gitkeep                      # Runtime upload directory placeholder
├── .env.example                      # Template environment configuration
├── .gitignore                        # Git exclusion rules
├── index.html                        # Application single-page interface
├── package.json                      # Dependencies and npm scripts
├── README.md                         # Project documentation
└── server.js                         # Application entrypoint & HTTP server
```

---

## 4. Requirements & Installation

- **Node.js:** v18.17+ or v20+ LTS (Tested on Node.js v24.18.0)
- **npm:** v9+ (Tested on npm 11.16.0)
- **MongoDB (Optional for offline use, required for cloud accounts):** Local `mongod` on port 27017 or MongoDB Atlas URI.

### Install Dependencies

```bash
npm install
```

### Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with appropriate placeholder values:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/safeshelf
JWT_SECRET=generate-a-unique-random-secret-at-least-32-characters
JWT_EXPIRES_IN=7d
TRUST_PROXY=false
EXTERNAL_PRODUCTS_ENABLED=true
EXTERNAL_PRODUCTS_URL=https://dummyjson.com/products?limit=100
```

> [!IMPORTANT]
> Never commit `.env` or hardcode production credentials. To generate a 256-bit random secret in your terminal:
> `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## 5. Starting the Application

### Offline / Local-First Mode (No MongoDB Required)

You do not need a running MongoDB daemon to run SafeShelf locally. Start the server directly:

```bash
npm start
```

SafeShelf will detect that MongoDB is offline, output a friendly notice (`MongoDB unavailable; product API will use local dataset`), and start on `http://localhost:3000`. In this mode:
- The full 112-product catalogue and all 10 departments are available.
- Inventory, shopping list, expiry tracking, analytics, and warranties are persisted in your browser's `localStorage`.
- The synchronization indicator displays `☁️ Offline`.
- Auth and cloud sync routes return HTTP `503 Service Unavailable` with friendly messages rather than pretending cloud saves occurred.

### Connected Mode (With MongoDB)

When MongoDB is running at the configured `MONGODB_URI`:
1. Start the server: `npm start`
2. Optional: Seed the catalogue into MongoDB: `npm run import:products`
3. Optional: Seed a test demo account: `npm run seed:demo`
4. Register or log in to sync user data across devices.

---

## 6. How to Run Tests

### Non-Database Test Suite (Can Be Executed Independently)

To run all non-database checks in one command:

```bash
npm test
```

This command runs the following three test suites sequentially:

1. **Syntax & Structural Integrity (`npm run check`):**
   ```bash
   npm run check
   ```
   Validates syntax across all 19 server and client JavaScript files.

2. **Concurrency & Logout Safety (`npm run test:concurrency`):**
   ```bash
   npm run test:concurrency
   ```
   Verifies:
   - Optimistic Concurrency Control (OCC) logic in `server/routes/userData.js`.
   - Initial write race condition protection (MongoDB E11000 duplicate key handling).
   - Version revision tracking per-user in `StorageModule`.
   - Pre-sync local storage persistence.
   - Comprehensive user data cleansing on logout (no shared-workstation data leaks).

3. **Database Offline Resilience (`npm run test:resilience`):**
   ```bash
   npm run test:resilience
   ```
   Verifies:
   - `/api/health` reports `database: 'offline'`.
   - Catalogue fallback serves all 112 local products and 10 categories.
   - Auth and cloud-save routes return HTTP 503 instead of false-positive successes.
   - Health endpoint reports `database: 'connected'` upon database recovery.

4. **Non-Database Features & Input Validation (`npm run test:non-db`):**
   ```bash
   npm run test:non-db
   ```
   Verifies:
   - Helmet security headers (`nosniff`, CSP, no `x-powered-by`).
   - In-memory external products caching (< 100ms response time).
   - CSV shopping import: valid files, empty files, malformed unclosed quotes, missing header, row limits (> 500 rows rejected with 413), and non-CSV rejection.
   - Image upload security: magic-byte validation for PNG, JPEG, and WebP, rejection of spoofed extensions, missing files, and unauthenticated requests.
   - Backup/restore schema integrity and rejection of malformed JSON.
   - Product form input validators (names, negative quantities, symbols, date formats).

---

### Tests Requiring Live MongoDB

The following test suites require a live, running MongoDB daemon on port 27017:

1. **Full API & Security Suite (`npm run test:api`):**
   ```bash
   npm run test:api
   ```
   *Requirements:* Active MongoDB connection.  
   *Scope:* Tests live user registration, login, duplicate email rejection (409), password hashing, user profile updates, multi-tenant read/write isolation between User A and User B, and live OCC rejection of stale versions.

2. **Browser End-to-End Suite (`npm run test:browser`):**
   ```bash
   npm run test:browser
   ```
   *Requirements:* Running SafeShelf server (`npm start`), active MongoDB instance, and seeded demo user (`npm run seed:demo`).  
   *Scope:* Playwright Chrome automation testing all 22 end-to-end user journeys (login, dashboard metrics, expiry navigation, product drawer, inventory editing, catalog search, CSV import modal, mobile viewport drawer toggle, and session logout).

---

## 7. Known Limitations & Teammate Handoff Notes

- **MongoDB Ownership:** Live database configuration, database connectivity, and live multi-tenant browser verification remain the responsibility of the database owner.
- **Image Lifecycle:** Uploaded product images are stored with UUID filenames in `uploads/`. An automated garbage collection job for orphaned photos on item deletion can be added in future versions.
- **Delivery Integration:** Direct external grocery ordering integrations (Amazon, Blinkit, Zepto, Instamart) are intentionally excluded from the V1 release scope.
