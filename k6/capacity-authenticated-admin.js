// Zyon Aaronel Wee Zhun Wei, A0277598B
import http from "k6/http";
import { check } from "k6";
import { Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";
const USER_EMAIL = __ENV.USER_EMAIL || "user@example.com";
const USER_PASSWORD = __ENV.USER_PASSWORD || "userpass";
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || "adminpass";

const authenticatedErrorRate = new Rate("authenticated_capacity_errors");
const userJourneyDuration = new Trend("user_capacity_iteration_duration");
const adminJourneyDuration = new Trend("admin_capacity_iteration_duration");
const ordersDuration = new Trend("user_capacity_orders_duration");
const allOrdersDuration = new Trend("admin_capacity_all_orders_duration");

// Zyon Aaronel Wee Zhun Wei, A0277598B
export const options = {
  scenarios: {
    user_capacity: {
      executor: "ramping-arrival-rate",
      exec: "userCapacityJourney",
      startRate: 2,
      timeUnit: "1s",
      preAllocatedVUs: 10,
      maxVUs: 60,
      stages: [
        { target: 4, duration: "1m" },
        { target: 8, duration: "2m" },
        { target: 12, duration: "2m" },
      ],
      gracefulStop: "30s",
    },
    admin_capacity: {
      executor: "ramping-arrival-rate",
      exec: "adminCapacityJourney",
      startRate: 1,
      timeUnit: "1s",
      preAllocatedVUs: 4,
      maxVUs: 20,
      stages: [
        { target: 2, duration: "1m" },
        { target: 4, duration: "2m" },
        { target: 6, duration: "2m" },
      ],
      gracefulStop: "30s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1200"],
    authenticated_capacity_errors: ["rate<0.01"],
    user_capacity_iteration_duration: ["p(95)<1800"],
    admin_capacity_iteration_duration: ["p(95)<2500"],
    user_capacity_orders_duration: ["p(95)<1200"],
    admin_capacity_all_orders_duration: ["p(95)<2200"],
  },
};

function login(email, password) {
  const res = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { "Content-Type": "application/json" } }
  );

  if (res.status !== 200 || !res.json("token")) {
    throw new Error(
      `Capacity setup failed: login for ${email} returned ${res.status}. ` +
        `Override USER_EMAIL/USER_PASSWORD or ADMIN_EMAIL/ADMIN_PASSWORD if needed.`
    );
  }

  return res.json("token");
}

// Zyon Aaronel Wee Zhun Wei, A0277598B
export function setup() {
  return {
    userToken: login(USER_EMAIL, USER_PASSWORD),
    adminToken: login(ADMIN_EMAIL, ADMIN_PASSWORD),
  };
}

function jsonHeaders(token) {
  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
  };
}

// Zyon Aaronel Wee Zhun Wei, A0277598B
export function userCapacityJourney(data) {
  const startedAt = Date.now();
  const requestOptions = jsonHeaders(data.userToken);

  let res = http.get(`${BASE_URL}/api/v1/auth/user-auth`, requestOptions);
  let ok = check(res, {
    "user capacity auth 200": (r) => r.status === 200,
  });
  authenticatedErrorRate.add(!ok);

  res = http.get(`${BASE_URL}/api/v1/auth/orders`, requestOptions);
  ordersDuration.add(res.timings.duration);
  ok = check(res, {
    "user capacity orders 200": (r) => r.status === 200,
  });
  authenticatedErrorRate.add(!ok);

  res = http.get(`${BASE_URL}/api/v1/product/braintree/token`, requestOptions);
  ok = check(res, {
    "user capacity braintree token 200": (r) => r.status === 200,
    "user capacity braintree token exists": (r) => {
      try {
        return !!r.json("clientToken");
      } catch {
        return false;
      }
    },
  });
  authenticatedErrorRate.add(!ok);

  userJourneyDuration.add(Date.now() - startedAt);
}

// Zyon Aaronel Wee Zhun Wei, A0277598B
export function adminCapacityJourney(data) {
  const startedAt = Date.now();
  const requestOptions = jsonHeaders(data.adminToken);

  let res = http.get(`${BASE_URL}/api/v1/auth/admin-auth`, requestOptions);
  let ok = check(res, {
    "admin capacity auth 200": (r) => r.status === 200,
  });
  authenticatedErrorRate.add(!ok);

  res = http.get(`${BASE_URL}/api/v1/auth/all-orders`, requestOptions);
  allOrdersDuration.add(res.timings.duration);
  ok = check(res, {
    "admin capacity all-orders 200": (r) => r.status === 200,
  });
  authenticatedErrorRate.add(!ok);

  res = http.get(`${BASE_URL}/api/v1/auth/all-users`, requestOptions);
  ok = check(res, {
    "admin capacity all-users 200": (r) => r.status === 200,
  });
  authenticatedErrorRate.add(!ok);

  res = http.get(`${BASE_URL}/api/v1/category/get-category`, requestOptions);
  ok = check(res, {
    "admin capacity categories 200": (r) => r.status === 200,
  });
  authenticatedErrorRate.add(!ok);

  adminJourneyDuration.add(Date.now() - startedAt);
}
