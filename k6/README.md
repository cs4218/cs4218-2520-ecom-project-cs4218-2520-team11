# k6 Stress Tests

## Prerequisites

```bash
brew install k6
npm run db:seed   # seed the DB with test data
npm run server    # start the backend on :6060
```

## Scripts

| File | What it tests | Peak VUs |
|------|---------------|----------|
| `public-products.js` | Product listing, search, filters, categories | 100 |
| `auth-flow.js` | Login (bcrypt bottleneck), forgot-password | 60 |
| `authenticated-user.js` | Orders, user-auth, Braintree token | 20 |
| `admin-flow.js` | All-orders, all-users, admin-auth | 15 |

## Running

```bash
# Individual scripts
k6 run k6/public-products.js
k6 run k6/auth-flow.js
k6 run k6/authenticated-user.js
k6 run k6/admin-flow.js

# With detailed percentile output
k6 run --summary-trend-stats="min,med,avg,p(90),p(95),p(99),max" k6/public-products.js

# Save raw JSON results for later analysis
k6 run --out json=k6/results-public.json k6/public-products.js
```

## Credentials

Update the email/password in each script to match your seeded users:

- `authenticated-user.js` + `auth-flow.js` → `test@test.com` / `password`
- `admin-flow.js` → `admin@test.com` / `password` (must have `role: 1` in DB)

## Expected bottlenecks

- **`/api/v1/auth/login`** — bcrypt is synchronous and CPU-bound; 60 concurrent logins will visibly spike latency
- **`/api/v1/product/product-photo/:pid`** — photo stored as Buffer in MongoDB; large payload, high memory
- **`/api/v1/auth/all-orders`** — unindexed full scan; will degrade as order count grows
- **`/api/v1/product/search/:keyword`** — no MongoDB text index by default
