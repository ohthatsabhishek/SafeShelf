# SafeShelf — Curated Household Pantry & Inventory Management

> **Store Smart. Stay Safe.**  
> SafeShelf is a full-stack household provisions manager, tracking pantry inventory, shelf-life expiry dates, restock schedules, and automated shopping lists with calm editorial precision.

---

## 1. Architecture & Technology Stack

SafeShelf is engineered with a strict separation of concerns, pairing a high-performance **Express.js / Node.js** backend and **MongoDB / Mongoose** data layer with a clean, responsive **vanilla HTML5, CSS3, and JavaScript** frontend (zero frontend frameworks or React dependencies).

- **Frontend:**
  - Semantic HTML5 structure with responsive layouts (desktop sidebar & mobile navigation).
  - Modern CSS3 with design tokens, glassmorphism, responsive grid, and fluid typography (Fraunces & Plus Jakarta Sans).
  - Vanilla JavaScript (ES6+) utilizing standard DOM APIs and asynchronous `fetch()`.
  - Client-side token storage, live low-stock email triggers ([EmailJS](https://www.emailjs.com/)), and real-time interactive UI controls.
- **Backend:**
  - **Runtime:** Node.js (v18+) with Express.js REST API framework.
  - **Database:** MongoDB with Mongoose ODM for schemas, validation, queries, and aggregation.
  - **File Uploads:** Multer with memory & disk storage handlers for image uploads (JPEG/PNG/WebP up to 5MB) and grocery CSV import preview.
  - **Security & Auth:**
    - Password hashing using `bcryptjs` (salt rounds: 12).
    - Stateless JWT authentication and route-level authorization middleware.
    - Security headers via `helmet`.
    - API request rate-limiting with `express-rate-limit`.
- **Testing & Automation:**
  - End-to-end browser automation with Playwright driving real Google Chrome.
  - Automated headless & headed QA test suites with verification screenshots.

---

## 2. Key Features

- **Authentication & Security:** Secure registration, password hashing, JWT issuance, protected API routes, and user data isolation.
- **Pantry Provisions CRUD:** Add, edit, inspect (detailed specification modal), and delete items with persistent storage in MongoDB.
- **Multer Product Photo Uploads:** Upload product imagery with live preview, MIME validation, file size limits, and local static serving (`/uploads`).
- **Expiry & Health Monitoring:** Real-time categorization of provisions into *Safe*, *Expiring Soon*, and *Expired*, with dynamic inventory health scoring (0–100%).
- **Unified Catalog Search:** Search across 112+ built-in pantry provisions stored in MongoDB, with seamless external enrichment fallbacks.
- **Smart Shopping List:** Automated low-stock provisions re-ordering, quick-add manual inputs, purchased state toggle, and PDF/print export.
- **Batch CSV Grocery Import:** Upload CSV grocery lists parsed via Multer, preview imported items, and commit them directly to the shopping list.
- **Household Profile & Preferences:** Update household identity, pantry title, and email notification settings via authenticated endpoints.

---

## 3. Project Directory Structure

```text
SafeShelf/
├── server.js               # Application entry point & Express server bootstrap
├── package.json            # Dependencies, scripts, and project metadata
├── package-lock.json       # Lockfile
├── .env.example            # Environment configuration template
├── .gitignore              # Git ignore rules for node_modules, secrets, uploads, logs
├── index.html              # Single-page application shell
├── css/
│   └── styles.css          # Editorial styles, design system tokens, responsive layout
├── js/
│   ├── config.js           # EmailJS client configuration
│   ├── auth.js             # Authentication, session handling, token storage
│   ├── inventory.js        # Inventory CRUD, Multer image upload handling, drawer logic
│   ├── features.js         # Unified catalog search, shopping list, low-stock emailer
│   ├── dashboard.js        # Metrics calculation, recent tables, routing, bootstrap
│   ├── dataset-catalog.js  # Offline dataset catalog store
│   ├── shopping-import.js  # CSV file handling and confirmation modal logic
│   └── live-demo-runner.js # In-browser live demo widget controller
├── data/
│   └── products.json       # 112-item curated provisions catalog dataset
├── dataset_assets/         # High-resolution catalog product images
├── images/                 # Static brand assets and UI icons
├── uploads/                # Multer uploaded product photos (.gitkeep preserved)
├── screenshots/            # Automated browser QA test run screenshots
├── scripts/
│   ├── import-products.js  # MongoDB catalog seeder (112 items)
│   ├── seed-demo.js        # Demo user & pantry seeder
│   ├── qa-browser-tests.js # Playwright E2E browser test runner
│   ├── live-demo.js        # Interactive live browser demo script
│   └── test-chrome.js      # Chrome browser diagnostic runner
└── server/
    ├── middleware/
    │   └── auth.js         # JWT verification & protected route guard
    ├── models/
    │   ├── User.js         # User account schema with bcrypt password hashing
    │   ├── Product.js      # Catalog product schema
    │   ├── InventoryItem.js# Household provisions inventory item schema
    │   └── ShoppingItem.js # Shopping list provision schema
    └── routes/
        ├── auth.js         # Register, login, verify, and profile update endpoints
        ├── products.js     # Catalog search and categories endpoint
        ├── userData.js     # User inventory and shopping list CRUD endpoints
        ├── uploads.js      # Multer image upload endpoint
        └── shoppingImport.js# Multer CSV grocery import parser endpoint
```

---

## 4. Prerequisites

Before running the project locally, ensure you have:

- **Node.js**: v18.0.0 or later (Node.js v20+ recommended)
- **npm**: v9.0.0 or later
- **MongoDB**: MongoDB Community Server running locally on port `27017` (or a remote MongoDB Atlas connection URI)
- **Google Chrome**: Installed locally if executing the Playwright browser test suite

---

## 5. Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/ohthatsabhishek/SafeShelf.git
cd SafeShelf
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the example environment file to `.env`:
```bash
cp .env.example .env
```
*(On Windows Command Prompt: `copy .env.example .env`)*

Configure your `.env` settings:
```ini
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/safeshelf
JWT_SECRET=your-random-32-character-secret-key
JWT_EXPIRES_IN=7d
EXTERNAL_PRODUCTS_ENABLED=true
EXTERNAL_PRODUCTS_URL=https://dummyjson.com/products?limit=100
```

### 4. Seed the Database
Seed the 112 curated pantry products and create the default demo household account:

```bash
# Import the product catalog dataset
npm run import:products

# Seed the demo account and sample household inventory
npm run seed:demo
```

**Default Demo Credentials:**
- **Email:** `demo@safeshelf.com`
- **Password:** `password`

---

## 6. Running the Application

### Start the Server
```bash
npm start
```

### Development Mode (with hot-reloading)
```bash
npm run dev
```

Open your browser and navigate to:
```text
http://localhost:3000
```

---

## 7. Testing & Quality Assurance

### Syntax & Integrity Checks
Verify that all backend modules, routes, and scripts parse without syntax errors:
```bash
npm run check
```

### Automated Browser Tests (Real Google Chrome via Playwright)
Run the full 15-point end-to-end browser test suite verifying authentication, Multer uploads, CRUD, catalog search, CSV imports, and persistence across page reloads:

```bash
npm run test:browser
```

Test results, metrics, and failure logs are automatically saved to `scripts/qa-browser-results.json` and screenshots to `screenshots/`.

---

## 8. API Reference

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---:|
| `POST` | `/api/auth/register` | Register a new household account | No |
| `POST` | `/api/auth/login` | Authenticate and receive JWT token | No |
| `GET` | `/api/auth/verify` | Verify current JWT token session | Yes (Bearer) |
| `PUT` | `/api/auth/profile` | Update household name & preferences | Yes (Bearer) |
| `GET` | `/api/products` | Search catalog items with filters (`?q=`, `?category=`) | No |
| `GET` | `/api/products/categories` | Retrieve all available provisions categories | No |
| `GET` | `/api/userdata` | Retrieve all inventory & shopping items for user | Yes (Bearer) |
| `POST` | `/api/userdata/inventory` | Create new inventory provision | Yes (Bearer) |
| `PUT` | `/api/userdata/inventory/:id` | Update existing inventory provision | Yes (Bearer) |
| `DELETE` | `/api/userdata/inventory/:id` | Delete inventory provision | Yes (Bearer) |
| `POST` | `/api/userdata/shopping` | Add item to shopping list | Yes (Bearer) |
| `PUT` | `/api/userdata/shopping/:id` | Update shopping list item (e.g. toggle purchased) | Yes (Bearer) |
| `DELETE` | `/api/userdata/shopping/:id` | Remove item from shopping list | Yes (Bearer) |
| `POST` | `/api/uploads/image` | Upload product image via Multer (multipart/form-data) | Yes (Bearer) |
| `POST` | `/api/shopping/import-csv` | Upload and preview grocery CSV via Multer | Yes (Bearer) |

---

## 9. License

This project is licensed under the MIT License.
