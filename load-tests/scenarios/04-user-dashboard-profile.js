import http from "k6/http";
import { check, sleep } from "k6";
import {
  BASE_URL,
  DEFAULT_THRESHOLDS,
  USER_ANSWER,
  USER_EMAIL,
  USER_PASSWORD,
  createRegisteredUser,
  jsonParams,
  login,
  sleepRange,
} from "./_shared.js";

/*
Load Test 4: User Dashboard and Profile Management
Objective: Measure authenticated reads and writes on profile and order-history
paths under concurrent user traffic.
*/

// Huang Yi Chee, A0259617R

export const options = {
  scenarios: {
    orders: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 15 },
        { duration: "10m", target: 15 },
        { duration: "30s", target: 0 },
      ],
      exec: "ordersFlow",
    },
    profile: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 10 },
        { duration: "10m", target: 10 },
        { duration: "30s", target: 0 },
      ],
      exec: "profileFlow",
    },
  },
  thresholds: DEFAULT_THRESHOLDS,
  summaryTrendStats: ["avg", "med", "p(90)", "p(95)", "p(99)", "max"],
};

export function setup() {
  if (USER_EMAIL && USER_PASSWORD) {
    const auth = login(USER_EMAIL, USER_PASSWORD, "dashboard_login_setup");
    return {
      token: auth.token,
      email: USER_EMAIL,
      password: USER_PASSWORD,
      answer: USER_ANSWER,
      currentName: auth.user.name,
      currentPhone: auth.user.phone,
      currentAddress: auth.user.address,
    };
  }

  const auth = createRegisteredUser("k6-dashboard");
  return {
    token: auth.token,
    email: auth.email,
    password: auth.password,
    answer: auth.answer,
    currentName: auth.user.name,
    currentPhone: auth.user.phone,
    currentAddress: auth.user.address,
  };
}

export function ordersFlow(data) {
  const ordersRes = http.get(`${BASE_URL}/api/v1/auth/orders`, {
    headers: { Authorization: data.token },
    tags: { name: "dashboard_get_orders", flow: "orders" },
  });
  check(ordersRes, {
    "orders fetch ok": (res) => res.status === 200,
  });

  sleep(sleepRange(1, 3));
}

export function profileFlow(data) {
  const profileRes = http.put(
    `${BASE_URL}/api/v1/auth/profile`,
    JSON.stringify({
      name: data.currentName,
      email: data.email,
      phone: data.currentPhone,
      address: data.currentAddress,
      password: "",
    }),
    jsonParams(data.token, { name: "dashboard_update_profile", flow: "profile" }),
  );
  check(profileRes, {
    "profile update ok": (res) => res.status === 200,
  });

  sleep(sleepRange(1, 3));
}
