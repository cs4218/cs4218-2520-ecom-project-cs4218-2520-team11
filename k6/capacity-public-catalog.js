// Zyon Aaronel Wee Zhun Wei, A0277598B
import http from "k6/http";
import { check } from "k6";
import { Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";

const errorRate = new Rate("catalog_capacity_errors");
const catalogIterationDuration = new Trend("catalog_capacity_iteration_duration");
const productListDuration = new Trend("catalog_capacity_product_list_duration");
const searchDuration = new Trend("catalog_capacity_search_duration");

const SEARCH_KEYWORDS = [
  "shirt",
  "shoes",
  "watch",
  "laptop",
  "phone",
  "bag",
  "hat",
];

// Zyon Aaronel Wee Zhun Wei, A0277598B
export const options = {
  scenarios: {
    catalog_capacity: {
      executor: "ramping-arrival-rate",
      exec: "catalogCapacityJourney",
      startRate: 5,
      timeUnit: "1s",
      preAllocatedVUs: 25,
      maxVUs: 120,
      stages: [
        { target: 10, duration: "1m" },
        { target: 20, duration: "2m" },
        { target: 30, duration: "2m" },
        { target: 40, duration: "2m" },
      ],
      gracefulStop: "30s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<800"],
    catalog_capacity_errors: ["rate<0.01"],
    catalog_capacity_iteration_duration: ["p(95)<1500"],
    catalog_capacity_product_list_duration: ["p(95)<700"],
    catalog_capacity_search_duration: ["p(95)<900"],
  },
};

// Zyon Aaronel Wee Zhun Wei, A0277598B
export function setup() {
  const res = http.get(`${BASE_URL}/api/v1/product/get-product`);

  if (res.status !== 200) {
    throw new Error(
      `Capacity setup failed: /api/v1/product/get-product returned ${res.status}.`
    );
  }

  const products = res.json("products") || [];
  if (products.length === 0) {
    throw new Error("Capacity setup failed: no seeded products were returned.");
  }

  return {
    products: products.map((product) => ({
      id: product._id,
      slug: product.slug,
      categoryId: product.category?._id || product.category,
    })),
  };
}

// Zyon Aaronel Wee Zhun Wei, A0277598B
export function catalogCapacityJourney(data) {
  const startedAt = Date.now();

  let res = http.get(`${BASE_URL}/api/v1/product/product-list/1`);
  productListDuration.add(res.timings.duration);
  let ok = check(res, {
    "catalog product-list 200": (r) => r.status === 200,
  });
  errorRate.add(!ok);

  res = http.get(`${BASE_URL}/api/v1/product/product-count`);
  ok = check(res, {
    "catalog product-count 200": (r) => r.status === 200,
  });
  errorRate.add(!ok);

  res = http.get(`${BASE_URL}/api/v1/category/get-category`);
  ok = check(res, {
    "catalog categories 200": (r) => r.status === 200,
  });
  errorRate.add(!ok);

  const keyword =
    SEARCH_KEYWORDS[Math.floor(Math.random() * SEARCH_KEYWORDS.length)];
  res = http.get(`${BASE_URL}/api/v1/product/search/${keyword}`);
  searchDuration.add(res.timings.duration);
  ok = check(res, {
    "catalog search 200": (r) => r.status === 200,
  });
  errorRate.add(!ok);

  const pickedProduct =
    data.products[Math.floor(Math.random() * data.products.length)];

  res = http.get(`${BASE_URL}/api/v1/product/get-product/${pickedProduct.slug}`);
  ok = check(res, {
    "catalog product detail 200": (r) => r.status === 200,
  });
  errorRate.add(!ok);

  if (pickedProduct.id && pickedProduct.categoryId) {
    res = http.get(
      `${BASE_URL}/api/v1/product/related-product/${pickedProduct.id}/${pickedProduct.categoryId}`
    );
    ok = check(res, {
      "catalog related products 200": (r) => r.status === 200,
    });
    errorRate.add(!ok);
  }

  catalogIterationDuration.add(Date.now() - startedAt);
}
