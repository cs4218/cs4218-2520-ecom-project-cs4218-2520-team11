import http from "k6/http";
import { check, sleep } from "k6";
import {
  BASE_URL,
  DEFAULT_THRESHOLDS,
  getCatalogFixture,
  randomItem,
  sleepRange,
} from "./_shared.js";

/*
Load Test 6: Category-Specific Browsing
Objective: Measure category list fetches and category-specific product reads.
*/

// Huang Yi Chee, A0259617R

export const options = {
  scenarios: {
    categories: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 10 },
        { duration: "5m", target: 10 },
        { duration: "30s", target: 0 },
      ],
      exec: "categoriesFlow",
    },
    categoryProducts: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 25 },
        { duration: "5m", target: 25 },
        { duration: "30s", target: 0 },
      ],
      exec: "categoryProductsFlow",
    },
  },
  thresholds: DEFAULT_THRESHOLDS,
  summaryTrendStats: ["avg", "med", "p(90)", "p(95)", "p(99)", "max"],
};

export function setup() {
  return getCatalogFixture();
}

export function categoriesFlow() {
  const categoriesRes = http.get(`${BASE_URL}/api/v1/category/get-category`, {
    tags: { name: "category_get_categories", flow: "categories" },
  });
  check(categoriesRes, {
    "categories fetch ok": (res) => res.status === 200,
  });

  sleep(sleepRange(1, 2.5));
}

export function categoryProductsFlow(data) {
  const category = randomItem(data.categories);
  const categoryRes = http.get(
    `${BASE_URL}/api/v1/product/product-category/${category.slug}`,
    {
      tags: { name: "category_get_products", flow: "category-products" },
    },
  );
  check(categoryRes, {
    "category product fetch ok": (res) => res.status === 200,
  });

  sleep(sleepRange(1, 2.5));
}
