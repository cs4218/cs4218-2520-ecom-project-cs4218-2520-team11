import http from "k6/http";
import { check, sleep } from "k6";
import {
  BASE_URL,
  DEFAULT_THRESHOLDS,
  PRICE_RANGES,
  SEARCH_KEYWORDS,
  getCatalogFixture,
  jsonParams,
  randomItem,
  sleepRange,
} from "./_shared.js";

/*
Load Test 1: Product Browsing, Search, and Filter
Objective: Verify the catalog endpoints sustain concurrent browsing, pagination,
search, and filter requests under expected shopping traffic.
*/

// Huang Yi Chee, A0259617R

export const options = {
  scenarios: {
    browse: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 20 }, // 40% of 50
        { duration: "10m", target: 20 },
        { duration: "30s", target: 0 },
      ],
      exec: "browseFlow",
    },
    pagination: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 15 }, // 30% of 50
        { duration: "10m", target: 15 },
        { duration: "30s", target: 0 },
      ],
      exec: "paginationFlow",
    },
    search: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 8 }, // 15% of 50
        { duration: "10m", target: 8 },
        { duration: "30s", target: 0 },
      ],
      exec: "searchFlow",
    },
    filter: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 7 }, // 15% of 50
        { duration: "10m", target: 7 },
        { duration: "30s", target: 0 },
      ],
      exec: "filterFlow",
    },
  },
  thresholds: DEFAULT_THRESHOLDS,
  summaryTrendStats: ["avg", "med", "p(90)", "p(95)", "p(99)", "max"],
};

export function setup() {
  return getCatalogFixture();
}

export function browseFlow() {
  const categoriesRes = http.get(`${BASE_URL}/api/v1/category/get-category`, {
    tags: { name: "browse_get_categories", flow: "browse" },
  });
  check(categoriesRes, {
    "categories fetch ok": (res) => res.status === 200,
  });

  const countRes = http.get(`${BASE_URL}/api/v1/product/product-count`, {
    tags: { name: "browse_get_product_count", flow: "browse" },
  });
  check(countRes, {
    "product count ok": (res) => res.status === 200,
  });

  sleep(sleepRange(1, 3));
}

export function paginationFlow() {
  const page = String(1 + Math.floor(Math.random() * 3));
  const pageRes = http.get(`${BASE_URL}/api/v1/product/product-list/${page}`, {
    tags: { name: "browse_get_product_list", flow: "pagination" },
  });
  check(pageRes, {
    "product list ok": (res) => res.status === 200,
  });

  sleep(sleepRange(1, 3));
}

export function searchFlow() {
  const keyword = randomItem(SEARCH_KEYWORDS);
  const searchRes = http.get(
    `${BASE_URL}/api/v1/product/search/${encodeURIComponent(keyword)}`,
    {
      tags: { name: "browse_search_products", flow: "search" },
    },
  );
  check(searchRes, {
    "product search ok": (res) => res.status === 200,
  });

  sleep(sleepRange(1, 3));
}

export function filterFlow(data) {
  const categoryIds = Object.values(data.categoryIds);
  const filterPayload = {
    checked: Math.random() < 0.6 ? [randomItem(categoryIds)] : [],
    radio: randomItem(PRICE_RANGES),
  };
  const filterRes = http.post(
    `${BASE_URL}/api/v1/product/product-filters`,
    JSON.stringify(filterPayload),
    jsonParams(undefined, { name: "browse_filter_products", flow: "filter" }),
  );
  check(filterRes, {
    "product filter ok": (res) => res.status === 200,
  });

  sleep(sleepRange(1, 3));
}
