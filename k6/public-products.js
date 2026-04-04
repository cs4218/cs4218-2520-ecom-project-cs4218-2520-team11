// Julius Bryan Reynon Gambe A0252251R
import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";

const errorRate = new Rate("errors");
const productListDuration = new Trend("product_list_duration");

export const options = {
  stages: [
    { duration: "1m", target: 100 }, // warm up
    { duration: "2m", target: 250 }, // ramp
    { duration: "2m", target: 500 }, // ramp
    { duration: "2m", target: 750 }, // ramp
    { duration: "4m", target: 750 }, // sustain peak
    { duration: "1m", target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"], // <1% errors
    http_req_duration: ["p(95)<500"], // 95% under 500ms
    product_list_duration: ["p(99)<1000"],
  },
};

const BASE = "http://localhost:6060";

export default function () {
  // Product listing (paginated — what the homepage actually calls)
  let res = http.get(`${BASE}/api/v1/product/product-list/1`);
  productListDuration.add(res.timings.duration);
  check(res, { "product list 200": (r) => r.status === 200 });
  errorRate.add(res.status !== 200);

  // Product count
  res = http.get(`${BASE}/api/v1/product/product-count`);
  check(res, { "product count 200": (r) => r.status === 200 });
  errorRate.add(res.status !== 200);

  // All categories
  res = http.get(`${BASE}/api/v1/category/get-category`);
  check(res, { "categories 200": (r) => r.status === 200 });
  errorRate.add(res.status !== 200);

  // Search — rotate through keywords to avoid cache effects
  const keywords = ["shirt", "shoes", "watch", "laptop", "phone", "bag", "hat"];
  const kw = keywords[Math.floor(Math.random() * keywords.length)];
  res = http.get(`${BASE}/api/v1/product/search/${kw}`);
  check(res, { "search 200": (r) => r.status === 200 });
  errorRate.add(res.status !== 200);

  // Product filters (what the sidebar filter calls)
  res = http.post(
    `${BASE}/api/v1/product/product-filters`,
    JSON.stringify({ checked: [], radio: [] }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(res, { "filters 200": (r) => r.status === 200 });
  errorRate.add(res.status !== 200);

  // Single product by slug — grab slug from listing first if possible
  res = http.get(`${BASE}/api/v1/product/get-product`);
  if (res.status === 200) {
    const products = res.json("products");
    if (products && products.length > 0) {
      const slug = products[Math.floor(Math.random() * products.length)].slug;
      const detail = http.get(`${BASE}/api/v1/product/get-product/${slug}`);
      check(detail, { "product detail 200": (r) => r.status === 200 });

      // Related products
      const p = products[0];
      const cid = p.category?._id ?? p.category;
      if (p._id && cid) {
        const related = http.get(
          `${BASE}/api/v1/product/related-product/${p._id}/${cid}`
        );
        check(related, { "related products 200": (r) => r.status === 200 });
      }
    }
  }

  sleep(1);
}
