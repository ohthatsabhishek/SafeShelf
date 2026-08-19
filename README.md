# SafeShelf — Smart Household Inventory

**Store Smart. Stay Safe.**

SafeShelf is a browser-based household inventory manager. It helps a
household track what they own, get warned before things expire, and
automatically builds a shopping list from items that are low or out of
stock — all built with **plain HTML, CSS and JavaScript** (no frameworks,
no backend server).

---

## 1. Problem Statement

Households lose money and waste food/medicine because nobody tracks
expiry dates or remaining stock in one place. SafeShelf solves this by
giving every user a private, persistent inventory they can search, sort,
filter, and act on — with automatic expiry alerts and an auto-generated
shopping list.

## 2. Features

- **Account system** — register, login, logout, edit profile (client-side, localStorage-backed)
- **Dashboard** — live stats (total items, expiring soon, expired, categories), inventory health score, "needs attention" list, recent items
- **Inventory management** — add / edit / delete products, search, filter by category & status, sort by column
- **Expiry tracking** — automatic Safe / Expiring Soon / Expired status based on the expiry date
- **Smart Shopping List** — automatically fills with out-of-stock / low-stock items, plus manual quick-add, tabs, print/PDF export
- **Category Explorer** — browse a built-in catalog of 30+ common household products across 9 categories and one-click add them to inventory
- **Smart Product Picker** — live search against a public REST API (DummyJSON) with automatic fallback to the built-in catalog if the API is unreachable or times out
- **This Session widget** — session-only stats (session start time, items added, searches run) stored in `sessionStorage`, separate from your permanent inventory data
- **Responsive design** — sidebar nav on desktop, bottom nav + slide-out drawer on mobile

## 3. Technologies Used

- HTML5, CSS3 (custom properties, flexbox/grid, responsive layout)
- Vanilla JavaScript (ES6+) — **no frameworks, no build tools, no backend**
- Browser `localStorage` and `sessionStorage`
- `fetch()` + `async/await` against the public [DummyJSON](https://dummyjson.com/) REST API

## 4. JavaScript Concepts Demonstrated

Variables & data types, type conversion, operators, conditionals, loops,
function declarations/expressions/arrow functions, scope, arrays &
array methods (`push/pop/splice/slice/map/filter/reduce/sort/forEach`),
objects & object destructuring, JSON, DOM selection & manipulation,
event handling & `preventDefault()`, form validation, `localStorage` &
`sessionStorage`, template literals, spread/rest/destructuring/default
parameters, promises, `async`/`await`, the Fetch API, and REST API error
handling. See the full mapping table shared with this project for exactly
where each concept lives.

## 5. Project Structure

```
SafeShelf/
├── index.html          # Single-page app shell — all views live here
├── css/
│   └── styles.css       # All styling
├── js/
│   ├── auth.js          # Member 1: Auth, Session (sessionStorage), Storage (localStorage)
│   ├── inventory.js     # Member 2: Product catalog data + Inventory CRUD
│   ├── features.js      # Member 3: Fetch API integration + Shopping List
│   └── dashboard.js     # Member 4: Dashboard, Categories, Navigation, app bootstrap
├── images/               # Product thumbnail images used by the built-in catalog
└── README.md
```

The four JS files are loaded as plain `<script>` tags, in this order,
at the bottom of `index.html`:

```html
<script src="js/auth.js"></script>
<script src="js/inventory.js"></script>
<script src="js/features.js"></script>
<script src="js/dashboard.js"></script>
```

Because they're classic scripts (not ES modules), they share one global
scope — a variable or object declared in an earlier file is visible to
every file loaded after it. This is what lets four separate files, each
written by a different team member, work together as a single app.

## 6. How to Run

No installation, no server, no `npm install` required.

1. Download/clone the project folder.
2. Double-click `index.html` (or right-click → Open With → your browser).
3. Log in with the demo account:
   - **Email:** `demo@safeshelf.com`
   - **Password:** `password`

   ...or click **Create Account** to register your own.

## 7. How the API Works

The **Categories** page and the **Smart Product Picker** (on the
Inventory page) call `https://dummyjson.com/products/search?q=...` using
`fetch()` inside an `async` function. The JSON response is parsed and
mapped onto SafeShelf's own category system. If the request fails, times
out (4 second `AbortController` timeout), or returns no results, the app
automatically falls back to a built-in local catalog (`CatalogStore`) so
the feature never breaks even without internet access — this fallback
logic is the app's error-handling demonstration.

## 8. Local Storage & Session Storage Usage

| Data | Storage | Why |
|---|---|---|
| Registered users & passwords | `localStorage` | Must persist across visits |
| Logged-in session pointer | `localStorage` | Keeps you logged in on refresh |
| Inventory products (per user) | `localStorage` | Core data — must survive closing the browser |
| Shopping list (per user) | `localStorage` | Same as above |
| "This Session" stats (start time, items added, searches run) | `sessionStorage` | Deliberately temporary — resets every new tab, to demonstrate the difference between the two storage APIs |

## 9. Team Members & Roles

| Member | Module | Files |
|---|---|---|
| Member 1 | Authentication, Session & Data Persistence | `js/auth.js` |
| Member 2 | Product Catalog & Inventory Management | `js/inventory.js` |
| Member 3 | Smart Features — REST API + Shopping List | `js/features.js` |
| Member 4 | Dashboard, Categories & Navigation | `js/dashboard.js` |

(Full division of responsibilities, commits, and demo talking points are
in the project write-up shared alongside this repository.)

## 10. Architecture / Flow

```
Login / Register (auth.js)
        │
        ▼
   Dashboard  ──▶  Inventory  ──▶  Expiring Soon
        │               │
        │               ▼
        │        Shopping List (auto-synced)
        │
        ▼
   Categories Explorer ──▶ (adds to Inventory)
```

All views live inside one `index.html` and are shown/hidden by
`NavigationModule` — there is no page reload when navigating.

## 11. Screenshots

_Add screenshots of the Dashboard, Inventory, Shopping List, and
Categories pages here before submission._

## 12. Future Scope

- Push/email notifications for expiring items
- Barcode scanning for faster product entry
- Multi-household / shared inventory support
