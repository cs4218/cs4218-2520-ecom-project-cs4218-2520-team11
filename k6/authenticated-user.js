// Julius Bryan Reynon Gambe A0252251R
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const errorRate = new Rate("errors");
const ordersDuration = new Trend("orders_duration");

export const options = {
  stages: [
    { duration: "1m", target: 50 },  // warm up
    { duration: "1m", target: 150 }, // ramp
    { duration: "2m", target: 300 }, // ramp
    { duration: "2m", target: 500 }, // ramp
    { duration: "3m", target: 500 }, // sustain peak
    { duration: "1m", target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<1000"],
    orders_duration: ["p(99)<2000"],
  },
};

const BASE = "http://localhost:6060";

// Runs once before VUs start — obtains a shared JWT
export function setup() {
  const res = http.post(
    `${BASE}/api/v1/auth/login`,
    JSON.stringify({ email: "user@example.com", password: "userpass" }),
    { headers: { "Content-Type": "application/json" } }
  );

  if (res.status !== 200) {
    throw new Error(
      `Setup failed: could not login. Status ${res.status} — is the server running and db seeded?`
    );
  }

  return { token: res.json("token") };
}

export default function ({ token }) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: token, // API reads raw token, no "Bearer " prefix
  };

  // Verify token is still valid
  let res = http.get(`${BASE}/api/v1/auth/user-auth`, { headers });
  const authOk = check(res, { "user-auth 200": (r) => r.status === 200 });
  errorRate.add(!authOk);
  if (!authOk) {
    sleep(1);
    return;
  }

  // Fetch user's orders
  res = http.get(`${BASE}/api/v1/auth/orders`, { headers });
  ordersDuration.add(res.timings.duration);
  check(res, {
    "orders 200": (r) => r.status === 200,
    "orders is array": (r) => {
      try {
        return Array.isArray(r.json());
      } catch {
        return false;
      }
    },
  });
  errorRate.add(res.status !== 200);

  // Braintree client token (read-only — don't POST payment)
  res = http.get(`${BASE}/api/v1/product/braintree/token`, { headers });
  check(res, {
    "braintree token 200": (r) => r.status === 200,
    "braintree token exists": (r) => {
      try {
        return r.json("clientToken") !== undefined;
      } catch {
        return false;
      }
    },
  });
  errorRate.add(res.status !== 200);

  sleep(2);
}
