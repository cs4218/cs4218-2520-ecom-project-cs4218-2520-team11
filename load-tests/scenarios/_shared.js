import http from "k6/http";
import { check, fail } from "k6";
import exec from "k6/execution";

// Huang Yi Chee, A0259617R

export const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";

export const DEFAULT_THRESHOLDS = {
  // Lecture: "anything above 1-2% flags serious underlying stability issue"
  http_req_failed: ["rate<0.01"],

  // Lecture: P90 is primary metric for typical user experience
  // P95 at 850-1200ms per lecture standards
  http_req_duration: ["p(90)<800", "p(95)<1200"],

  // Lecture: throughput = total successful requests / total time
  // With 50 VUs and 1-3s think time -> ~15 req/s floor 
  http_reqs: ["rate>15"],

  // Catches silent check() failures not captured by http_req_failed
  // 99% aligns with the <1% error rate standard from lecture
  checks: ["rate>0.99"],
};

export const USER_EMAIL = __ENV.K6_USER_EMAIL || __ENV.USER_EMAIL || "";
export const USER_PASSWORD =
  __ENV.K6_USER_PASSWORD || __ENV.USER_PASSWORD || "";
export const USER_ANSWER = __ENV.K6_USER_ANSWER || __ENV.USER_ANSWER || "test";

export const ADMIN_EMAIL = __ENV.K6_ADMIN_EMAIL || __ENV.ADMIN_EMAIL || "";
export const ADMIN_PASSWORD =
  __ENV.K6_ADMIN_PASSWORD || __ENV.ADMIN_PASSWORD || "";

export const PAYMENT_NONCE = __ENV.K6_PAYMENT_NONCE || "fake-valid-nonce";

export const SEARCH_KEYWORDS = [
  "textbook",
  "laptop",
  "smartphone",
  "novel",
  "contract",
  "shirt",
];

export const PRICE_RANGES = [
  [0, 20],
  [20, 100],
  [100, 1000],
  [1000, 2000],
];

export const SEED_CATEGORY_IDS = {
  electronics: "66db427fdb0119d9234b27ed",
  clothing: "66db427fdb0119d9234b27ee",
  book: "66db427fdb0119d9234b27ef",
};

export function jsonParams(token, tags = {}) {
  const headers = { "Content-Type": "application/json" };

  if (token) {
    headers.Authorization = token;
  }

  return { headers, tags };
}

export function multipartParams(token, tags = {}) {
  const headers = {};

  if (token) {
    headers.Authorization = token;
  }

  return { headers, tags };
}

export function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export function uniqueSuffix() {
  let vuId = 0;
  let iteration = 0;

  try {
    vuId = exec.vu.idInTest || 0;
  } catch (_error) {
    vuId = 0;
  }

  try {
    iteration = exec.scenario.iterationInTest || 0;
  } catch (_error) {
    iteration = 0;
  }

  return `${Date.now()}-${vuId}-${iteration}`;
}

export function sleepRange(minSeconds, maxSeconds) {
  const span = maxSeconds - minSeconds;
  return minSeconds + Math.random() * span;
}

export function buildStages(vus, rampUp, steady, rampDown = "30s") {
  return [
    { duration: rampUp, target: vus },
    { duration: steady, target: vus },
    { duration: rampDown, target: 0 },
  ];
}

export function assertOk(response, label) {
  const passed = check(response, {
    [`${label} status is 2xx/3xx`]: (res) => res.status >= 200 && res.status < 400,
  });

  if (!passed) {
    fail(`${label} failed with status ${response.status}: ${response.body}`);
  }
}

export function getCatalogFixture() {
  const categoriesRes = http.get(`${BASE_URL}/api/v1/category/get-category`, {
    tags: { name: "catalog_get_categories", flow: "setup" },
  });
  assertOk(categoriesRes, "catalog categories setup");

  const categories = categoriesRes.json("category") || [];

  const productListRes = http.get(`${BASE_URL}/api/v1/product/product-list/1`, {
    tags: { name: "catalog_get_product_list", flow: "setup" },
  });
  assertOk(productListRes, "catalog product list setup");

  const products = productListRes.json("products") || [];

  return {
    categories,
    products,
    categoryIds: categories.reduce((acc, category) => {
      acc[category.slug] = category._id;
      return acc;
    }, { ...SEED_CATEGORY_IDS }),
  };
}

export function login(email, password, tag = "auth_login_setup") {
  const response = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email, password }),
    jsonParams(undefined, { name: tag, flow: "setup" }),
  );
  assertOk(response, `login for ${email}`);

  const token = response.json("token");
  const user = response.json("user");

  if (!token) {
    fail(`login for ${email} did not return a token`);
  }

  return { token, user, email };
}

export function requireAdminCredentials() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    fail(
      "Admin scenarios require K6_ADMIN_EMAIL and K6_ADMIN_PASSWORD (or ADMIN_EMAIL / ADMIN_PASSWORD).",
    );
  }
}

export function createRegisteredUser(prefix = "k6-user") {
  const suffix = uniqueSuffix();
  const email = `${prefix}-${suffix}@example.com`;
  const password = `Pass-${suffix}!`;
  const answer = `${prefix}-answer-${suffix}`;

  const payload = {
    name: `K6 ${prefix} ${suffix}`,
    email,
    password,
    phone: "81234567",
    address: "1 Computing Drive",
    DOB: "2000-01-01",
    answer,
  };

  const registerRes = http.post(
    `${BASE_URL}/api/v1/auth/register`,
    JSON.stringify(payload),
    jsonParams(undefined, { name: "auth_register_setup", flow: "setup" }),
  );
  assertOk(registerRes, `register ${email}`);

  const auth = login(email, password, "auth_login_new_user_setup");
  return { ...auth, password, answer };
}

export function createAdminCategory(token) {
  const suffix = uniqueSuffix();
  const name = `k6-category-${suffix}`;
  const response = http.post(
    `${BASE_URL}/api/v1/category/create-category`,
    JSON.stringify({ name }),
    jsonParams(token, { name: "admin_create_category_setup", flow: "setup" }),
  );
  assertOk(response, "admin create category setup");

  return response.json("category");
}

export function createAdminProduct(token, categoryId) {
  const suffix = uniqueSuffix();
  const body = {
    name: `k6-product-${suffix}`,
    description: `Synthetic product created by k6 ${suffix}`,
    price: "12.34",
    quantity: "25",
    category: categoryId,
    shipping: "1",
    photo: http.file("k6 image payload", `k6-${suffix}.png`, "image/png"),
  };

  const response = http.post(
    `${BASE_URL}/api/v1/product/create-product`,
    body,
    multipartParams(token, { name: "admin_create_product_setup", flow: "setup" }),
  );
  assertOk(response, "admin create product setup");

  return response.json("products");
}

export function buildSyntheticCart(products) {
  return products.slice(0, 2).map((product) => ({
    _id: product._id,
    name: product.name,
    description: product.description,
    price: product.price,
    quantity: product.quantity,
    slug: product.slug,
    shipping: product.shipping,
  }));
}
