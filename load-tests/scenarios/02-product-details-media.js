import http from "k6/http";
import { check, sleep } from "k6";
import {
  BASE_URL,
  DEFAULT_THRESHOLDS,
  assertOk,
  getCatalogFixture,
  randomItem,
  sleepRange,
} from "./_shared.js";

/*
Load Test 2: Product Details and Media
Objective: Measure response time for detailed product reads, related-product
queries, and binary image streaming.
*/

// Huang Yi Chee, A0259617R

export const options = {
  scenarios: {
    details: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 20 },
        { duration: "10m", target: 20 },
        { duration: "30s", target: 0 },
      ],
      exec: "detailsFlow",
    },
    media: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 20 },
        { duration: "10m", target: 20 },
        { duration: "30s", target: 0 },
      ],
      exec: "mediaFlow",
    },
  },
  thresholds: DEFAULT_THRESHOLDS,
  summaryTrendStats: ["avg", "med", "p(90)", "p(95)", "p(99)", "max"],
};

export function setup() {
  const fixture = getCatalogFixture();
  const detailCandidates = [];

  for (const product of fixture.products) {
    const detailRes = http.get(
      `${BASE_URL}/api/v1/product/get-product/${product.slug}`,
      {
        tags: { name: "details_setup_get_product", flow: "setup" },
      },
    );
    assertOk(detailRes, `product details setup for ${product.slug}`);
    detailCandidates.push(detailRes.json("product"));
  }

  return { ...fixture, detailCandidates };
}

export function detailsFlow(data) {
  const product = randomItem(data.detailCandidates);

  const detailsRes = http.get(
    `${BASE_URL}/api/v1/product/get-product/${product.slug}`,
    {
      tags: { name: "details_get_product", flow: "details" },
    },
  );
  check(detailsRes, {
    "product details ok": (res) => res.status === 200,
  });

  const relatedRes = http.get(
    `${BASE_URL}/api/v1/product/related-product/${product._id}/${product.category._id}`,
    {
      tags: { name: "details_get_related", flow: "details" },
    },
  );
  check(relatedRes, {
    "related products ok": (res) => res.status === 200,
  });

  sleep(sleepRange(1, 2.5));
}

export function mediaFlow(data) {
  const product = randomItem(data.detailCandidates);

  const photoRes = http.get(
    `${BASE_URL}/api/v1/product/product-photo/${product._id}`,
    {
      tags: { name: "details_get_photo", flow: "media" },
      responseType: "binary",
    },
  );
  check(photoRes, {
    "product photo ok": (res) => res.status === 200,
    "product photo has bytes": (res) => (res.body ? res.body.byteLength > 0 : false),
  });

  sleep(sleepRange(1, 2.5));
}
