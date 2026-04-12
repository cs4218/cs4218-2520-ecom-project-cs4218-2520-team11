// Zyon Aaronel Wee Zhun Wei, A0277598B
import http from "k6/http";
import { check } from "k6";
import { Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";

const errorRate = new Rate("search_filter_capacity_errors");
const iterationDuration = new Trend("search_filter_capacity_iteration_duration");
const searchDuration = new Trend("search_filter_capacity_search_duration");
const filterDuration = new Trend("search_filter_capacity_filter_duration");

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
    search_filter_capacity: {
      executor: "ramping-arrival-rate",
      exec: "searchFilterCapacityJourney",
      startRate: 3,
      timeUnit: "1s",
      preAllocatedVUs: 15,
      maxVUs: 80,
      stages: [
        { target: 6, duration: "1m" },
        { target: 12, duration: "2m" },
        { target: 18, duration: "2m" },
        { target: 24, duration: "2m" },
      ],
      gracefulStop: "30s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1000"],
    search_filter_capacity_errors: ["rate<0.01"],
    search_filter_capacity_iteration_duration: ["p(95)<1800"],
    search_filter_capacity_search_duration: ["p(95)<900"],
    search_filter_capacity_filter_duration: ["p(95)<1000"],
  },
};

// Zyon Aaronel Wee Zhun Wei, A0277598B
export function searchFilterCapacityJourney() {
  const startedAt = Date.now();
  const keyword =
    SEARCH_KEYWORDS[Math.floor(Math.random() * SEARCH_KEYWORDS.length)];

  let res = http.get(`${BASE_URL}/api/v1/product/search/${keyword}`);
  searchDuration.add(res.timings.duration);
  let ok = check(res, {
    "search capacity 200": (r) => r.status === 200,
  });
  errorRate.add(!ok);

  const payload = JSON.stringify({
    checked: [],
    radio: [],
  });

  res = http.post(`${BASE_URL}/api/v1/product/product-filters`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  filterDuration.add(res.timings.duration);
  ok = check(res, {
    "filter capacity 200": (r) => r.status === 200,
  });
  errorRate.add(!ok);

  iterationDuration.add(Date.now() - startedAt);
}
