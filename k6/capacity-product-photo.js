// Zyon Aaronel Wee Zhun Wei, A0277598B
import http from "k6/http";
import { check } from "k6";
import { Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";

const errorRate = new Rate("photo_capacity_errors");
const iterationDuration = new Trend("photo_capacity_iteration_duration");
const photoDuration = new Trend("photo_capacity_download_duration");

// Zyon Aaronel Wee Zhun Wei, A0277598B
export const options = {
  scenarios: {
    photo_capacity: {
      executor: "ramping-arrival-rate",
      exec: "photoCapacityJourney",
      startRate: 2,
      timeUnit: "1s",
      preAllocatedVUs: 10,
      maxVUs: 60,
      stages: [
        { target: 4, duration: "1m" },
        { target: 8, duration: "2m" },
        { target: 12, duration: "2m" },
        { target: 16, duration: "2m" },
      ],
      gracefulStop: "30s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1500"],
    photo_capacity_errors: ["rate<0.01"],
    photo_capacity_iteration_duration: ["p(95)<1700"],
    photo_capacity_download_duration: ["p(95)<1400"],
  },
};

// Zyon Aaronel Wee Zhun Wei, A0277598B
export function setup() {
  const res = http.get(`${BASE_URL}/api/v1/product/get-product`);

  if (res.status !== 200) {
    throw new Error(
      `Photo capacity setup failed: /api/v1/product/get-product returned ${res.status}.`
    );
  }

  const products = res.json("products") || [];
  const productIds = products.map((product) => product._id).filter(Boolean);

  if (productIds.length === 0) {
    throw new Error("Photo capacity setup failed: no seeded product ids found.");
  }

  return { productIds };
}

// Zyon Aaronel Wee Zhun Wei, A0277598B
export function photoCapacityJourney(data) {
  const startedAt = Date.now();
  const productId =
    data.productIds[Math.floor(Math.random() * data.productIds.length)];

  const res = http.get(`${BASE_URL}/api/v1/product/product-photo/${productId}`, {
    responseType: "binary",
  });

  photoDuration.add(res.timings.duration);
  const ok = check(res, {
    "photo capacity 200": (r) => r.status === 200,
    "photo content returned": (r) => {
      if (!r.body) {
        return false;
      }

      if (typeof r.body === "string") {
        return r.body.length > 0;
      }

      if (typeof r.body.byteLength === "number") {
        return r.body.byteLength > 0;
      }

      return false;
    },
  });
  errorRate.add(!ok);

  iterationDuration.add(Date.now() - startedAt);
}
