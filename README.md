# ShopSmart

A full-stack shopping app built with React (frontend) and Node.js + Express + SQLite (backend).

---

## Architecture

```
shopsmart/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProductCard.jsx   # Reusable product display card
│   │   │   └── CartSidebar.jsx   # Slide-out cart panel
│   │   ├── App.jsx               # Root component, API calls, state
│   │   └── App.test.jsx          # Frontend unit tests (Vitest)
│   └── package.json
│
├── server/                  # Express backend
│   ├── src/
│   │   ├── db/
│   │   │   └── database.js       # SQLite setup, idempotent schema init
│   │   ├── routes/
│   │   │   ├── products.js       # Full CRUD: GET/POST/PUT/DELETE /api/products
│   │   │   └── cart.js           # Cart: GET/POST/DELETE /api/cart
│   │   ├── app.js                # Express app, middleware, route mounting
│   │   └── index.js              # Server entry point
│   └── tests/
│       └── app.test.js           # Unit + integration tests (Jest + Supertest)
│
├── e2e/
│   └── shopsmart.spec.js         # E2E tests (Playwright)
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                # CI: lint + test on push/PR
│   │   └── deploy.yml            # CD: SSH deploy to EC2 on push to main
│   └── dependabot.yml            # Auto dependency updates
│
├── deploy.sh                     # Idempotent EC2 deployment script
├── playwright.config.js
└── render.yaml                   # Render.com deployment config
```

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18, Vite, Vitest, @testing-library/react |
| Backend    | Node.js, Express 4, better-sqlite3 |
| Database   | SQLite (via better-sqlite3)       |
| Testing    | Jest, Supertest, Playwright       |
| Linting    | ESLint (client + server)          |
| CI/CD      | GitHub Actions                    |
| Deployment | Render.com (PaaS) / AWS EC2       |

---

## API Reference

### Products

| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | `/api/products`       | List all products        |
| GET    | `/api/products/:id`   | Get single product       |
| POST   | `/api/products`       | Create product           |
| PUT    | `/api/products/:id`   | Update product           |
| DELETE | `/api/products/:id`   | Delete product           |

**POST /api/products body:**
```json
{ "name": "Apple", "price": 1.5, "category": "fruit", "stock": 100 }
```

### Cart

| Method | Endpoint          | Description           |
|--------|-------------------|-----------------------|
| GET    | `/api/cart`       | Get all cart items    |
| POST   | `/api/cart`       | Add item to cart      |
| DELETE | `/api/cart/:id`   | Remove item from cart |

### Health

| Method | Endpoint       | Description       |
|--------|----------------|-------------------|
| GET    | `/api/health`  | Server health check |

---

## Running Locally

**Prerequisites:** Node.js 20+

```bash
# Backend
cd server
npm install
npm run dev        # runs on http://localhost:5001

# Frontend (new terminal)
cd client
npm install
npm run dev        # runs on http://localhost:5173

# Run all backend tests
cd server && npm test

# Run all frontend tests
cd client && npm test -- --run

# Run E2E tests (both servers must be running)
npx playwright test
```

---

## CI/CD Pipeline

### GitHub Actions – `ci.yml`

Triggers on every **push** and **pull request** to `main`:

1. Install dependencies (`npm ci`)
2. Run ESLint — PR **fails** if lint errors exist
3. Run Jest/Vitest tests — PR **fails** if any test fails
4. Build the frontend (catches compile errors)

### GitHub Actions – `deploy.yml`

Triggers on push to `main` after CI passes. SSHes into the EC2 instance and runs `deploy.sh`.

**Required GitHub Secrets:**

| Secret         | Description                       |
|----------------|-----------------------------------|
| `EC2_HOST`     | EC2 public IP or DNS              |
| `EC2_USER`     | SSH user (e.g. `ubuntu`)         |
| `EC2_SSH_KEY`  | Private key content (PEM format) |

---

## Testing Strategy

### Unit Tests
- **Backend:** Each route handler is tested individually with Supertest
- **Frontend:** Each component is tested with @testing-library/react + Vitest

### Integration Tests
- Backend tests use a real SQLite test database
- Tests verify the full chain: HTTP request → Express router → DB → response
- Cart tests verify the foreign-key relationship between cart_items and products

### E2E Tests (Playwright)
Simulates real user flows in a Chromium browser:
1. Homepage loads with navbar
2. Products appear from the API
3. Search filters products in real time
4. Add to cart → view cart → remove item
5. Cart counter updates correctly

---

## Design Decisions

**Why SQLite over PostgreSQL?**  
SQLite needs zero infrastructure for a project this size. `better-sqlite3` is synchronous, making the code simpler and more predictable in tests. For production scale, swapping to PostgreSQL would require only changing the DB driver.

**Why separate `app.js` and `index.js`?**  
Supertest needs to import the Express `app` without starting a TCP listener. Separating them lets tests import `app.js` directly without binding a port.

**Why Vitest on the frontend instead of Jest?**  
Vitest integrates natively with Vite — no extra Babel config, no transform setup, and it shares the same `vite.config.js`. Tests run significantly faster.

**Why Playwright for E2E?**  
Playwright has built-in support for multiple browser engines, auto-waiting (no manual `sleep()`), and a `request` fixture for API seeding within tests — which made writing the E2E flows much cleaner.

**Why `npm ci` in CI instead of `npm install`?**  
`npm ci` installs exactly what's in `package-lock.json` and fails if the lockfile is out of sync. This prevents "works on my machine" bugs caused by version drift.

---

## Idempotency

All scripts are safe to run multiple times:

- `deploy.sh` — uses `mkdir -p`, checks if Node/PM2 are already installed before installing, uses `pm2 restart` if process exists
- `database.js` — uses `CREATE TABLE IF NOT EXISTS` so schema init never fails on re-run
- `npm ci` — deterministic, always produces the same result

---

## Challenges

**CORS in development vs production:** The Vite proxy (`/api → localhost:5001`) handles CORS locally. In production on Render, the frontend's `VITE_API_URL` env var is set to the backend's URL, so requests go directly to the API origin — no proxy needed.

**SQLite in CI:** The test database path is set via `process.env.DB_PATH` to a temp file, which is deleted after each test run. This keeps CI clean between runs.

**Playwright test isolation:** Each E2E test seeds its own data via the API before running. The backend uses a fresh SQLite file per test environment, preventing test interference.
