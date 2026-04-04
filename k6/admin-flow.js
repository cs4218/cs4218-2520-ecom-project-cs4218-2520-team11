import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const errorRate = new Rate("errors");
const allOrdersDuration = new Trend("all_orders_duration");

export const options = {
  // Admin endpoints are low-traffic in reality — stress test with gradual ramp
  stages: [
    { duration: "1m", target: 5 },   // warm up
    { duration: "1m", target: 10 },  // ramp
    { duration: "2m", target: 15 },  // ramp
    { duration: "1m", target: 20 },  // ramp
    { duration: "2m", target: 20 },  // sustain peak
    { duration: "1m", target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<2000"], // admin endpoints can be slower (full table scans)
    all_orders_duration: ["p(99)<3000"],
  },
};

const BASE = "http://localhost:6060";

export function setup() {
  // Login as admin — update these credentials to match your seeded admin user
  const res = http.post(
    `${BASE}/api/v1/auth/login`,
    JSON.stringify({ email: "admin@example.com", password: "adminpass" }),
    { headers: { "Content-Type": "application/json" } }
  );

  if (res.status !== 200) {
    throw new Error(
      `Setup failed: could not login as admin. Status ${res.status}\n` +
      `Make sure admin@example.com exists with role=1 after db:seed.`
    );
  }

  return { token: res.json("token") };
}

export default function ({ token }) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: token,
  };

  // Verify admin auth
  let res = http.get(`${BASE}/api/v1/auth/admin-auth`, { headers });
  const authOk = check(res, { "admin-auth 200": (r) => r.status === 200 });
  errorRate.add(!authOk);
  if (!authOk) {
    sleep(1);
    return;
  }

  // All orders — full table scan, likely to degrade under load
  res = http.get(`${BASE}/api/v1/auth/all-orders`, { headers });
  allOrdersDuration.add(res.timings.duration);
  check(res, { "all-orders 200": (r) => r.status === 200 });
  errorRate.add(res.status !== 200);

  // All users
  res = http.get(`${BASE}/api/v1/auth/all-users`, { headers });
  check(res, { "all-users 200": (r) => r.status === 200 });
  errorRate.add(res.status !== 200);

  // All categories (admin reads same endpoint as public)
  res = http.get(`${BASE}/api/v1/category/get-category`, { headers });
  check(res, { "categories 200": (r) => r.status === 200 });

  sleep(2);
}
