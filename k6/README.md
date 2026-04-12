# k6 Non-Functional Tests

## Prerequisites

```bash
brew install k6
npm run db:seed
npm run server
```

## Stress Test Scripts

| File | Owner | What it tests | Load model |
|------|-------|---------------|------------|
| `public-products.js` | Julius Bryan Reynon Gambe, A0252251R | Product listing, search, filters, categories | Stress ramp to peak concurrency |
| `auth-flow.js` | Julius Bryan Reynon Gambe, A0252251R | Login and forgot-password | Stress ramp to peak concurrency |
| `authenticated-user.js` | Julius Bryan Reynon Gambe, A0252251R | Orders, user-auth, Braintree token | Stress ramp to peak concurrency |
| `admin-flow.js` | Julius Bryan Reynon Gambe, A0252251R | All-orders, all-users, admin-auth | Stress ramp to peak concurrency |

## Capacity Test Scripts

| File | Owner | What it tests | Capacity model |
|------|-------|---------------|----------------|
| `capacity-public-catalog.js` | Zyon Aaronel Wee Zhun Wei, A0277598B | Public catalog browsing, search, related products | Sustained arrival rate up to 40 iterations/sec |
| `capacity-authenticated-admin.js` | Zyon Aaronel Wee Zhun Wei, A0277598B | Authenticated user and admin dashboard reads | Sustained arrival rates up to 12 user iters/sec and 6 admin iters/sec |
| `capacity-search-filter.js` | Zyon Aaronel Wee Zhun Wei, A0277598B | Search and filter endpoints | Sustained arrival rate up to 24 iterations/sec |
| `capacity-product-photo.js` | Zyon Aaronel Wee Zhun Wei, A0277598B | Product photo delivery endpoint | Sustained arrival rate up to 16 iterations/sec |

## Running

```bash
# Stress tests
k6 run k6/public-products.js
k6 run k6/auth-flow.js
k6 run k6/authenticated-user.js
k6 run k6/admin-flow.js

# Capacity tests
k6 run k6/capacity-public-catalog.js
k6 run k6/capacity-authenticated-admin.js
k6 run k6/capacity-search-filter.js
k6 run k6/capacity-product-photo.js

# Save JSON results for the report
k6 run --summary-trend-stats="avg,min,med,p(90),p(95),p(99),max" --out json=k6/results-capacity-public.json k6/capacity-public-catalog.js
k6 run --summary-trend-stats="avg,min,med,p(90),p(95),p(99),max" --out json=k6/results-capacity-auth-admin.json k6/capacity-authenticated-admin.js
k6 run --summary-trend-stats="avg,min,med,p(90),p(95),p(99),max" --out json=k6/results-capacity-search-filter.json k6/capacity-search-filter.js
k6 run --summary-trend-stats="avg,min,med,p(90),p(95),p(99),max" --out json=k6/results-capacity-photo.json k6/capacity-product-photo.js
```

## Credentials

`capacity-authenticated-admin.js` uses these defaults:

- `USER_EMAIL=user@example.com`
- `USER_PASSWORD=userpass`
- `ADMIN_EMAIL=admin@example.com`
- `ADMIN_PASSWORD=adminpass`

Override them if your local seeded credentials differ:

```bash
USER_EMAIL=user@example.com USER_PASSWORD=userpass ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=adminpass k6 run k6/capacity-authenticated-admin.js
```

## Reading Capacity Results

- `capacity-public-catalog.js` measures the highest sustained public browsing rate that still satisfies the configured latency and error thresholds.
- `capacity-authenticated-admin.js` measures the highest sustained authenticated and admin dashboard throughput that still satisfies the configured latency and error thresholds.
- `capacity-search-filter.js` isolates the search and filter workload so it can be compared separately against general catalog browsing capacity.
- `capacity-product-photo.js` measures the sustainable rate for binary photo delivery, which is usually constrained by payload size and I/O rather than only query latency.
- For the milestone report, treat the highest fully passing stage as the current practical capacity of that flow.

## Expected Bottlenecks

- `/api/v1/auth/login` is CPU-heavy because bcrypt hashing is synchronous.
- `/api/v1/auth/all-orders` and `/api/v1/auth/all-users` are likely to slow down first as dataset size grows.
- `/api/v1/product/search/:keyword` is sensitive to collection size and indexing quality.
- `/api/v1/product/get-product/:slug` and related catalog reads should remain the highest-capacity flows because they are read-only and simpler.
