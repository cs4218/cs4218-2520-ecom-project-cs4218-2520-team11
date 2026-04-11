import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  BASE_URL,
  DEFAULT_THRESHOLDS,
  USER_EMAIL,
  USER_PASSWORD,
  createRegisteredUser,
  jsonParams,
  login,
  requireAdminCredentials,
  sleepRange,
} from "./_shared.js";

const adminUsersDuration = new Trend("admin_users_duration", true);
const adminAllOrdersDuration = new Trend("admin_all_orders_duration", true);
const adminFetchOrdersForUpdateDuration = new Trend("admin_fetch_orders_for_update_duration", true);
const adminOrderStatusUpdateDuration = new Trend("admin_order_status_update_duration", true);

/*
Load Test 8: Admin User and Order Operations
Objective: Measure admin read-heavy order/user retrieval and occasional status
updates against real authenticated endpoints.
*/

// Huang Yi Chee, A0259617R

export const options = {
  scenarios: {
    adminRead: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 8 },
        { duration: "5m", target: 8 },
        { duration: "30s", target: 0 },
      ],
      exec: "adminReadFlow",
    },
    adminWrite: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 2 },
        { duration: "5m", target: 2 },
        { duration: "30s", target: 0 },
      ],
      exec: "adminWriteFlow",
    },
  },
  thresholds: DEFAULT_THRESHOLDS,
  summaryTrendStats: ["avg", "med", "p(90)", "p(95)", "p(99)", "max"],
};

export function setup() {
  requireAdminCredentials();
  const admin = login(ADMIN_EMAIL, ADMIN_PASSWORD, "admin_orders_login_setup");

  let user;
  if (USER_EMAIL && USER_PASSWORD) {
    user = login(USER_EMAIL, USER_PASSWORD, "admin_orders_user_setup");
  } else {
    user = createRegisteredUser("k6-orders");
  }

  return {
    adminToken: admin.token,
    userToken: user.token,
  };
}

export function adminReadFlow(data) {
  const batch = http.batch([
    [
      "GET",
      `${BASE_URL}/api/v1/auth/all-users`,
      null,
      {
        headers: { Authorization: data.adminToken },
        tags: { name: "admin_get_users", flow: "admin-read" },
      },
    ],
    [
      "GET",
      `${BASE_URL}/api/v1/auth/all-orders`,
      null,
      {
        headers: { Authorization: data.adminToken },
        tags: { name: "admin_get_all_orders", flow: "admin-read" },
      },
    ],
  ]);

  adminUsersDuration.add(batch[0].timings.duration);
  adminAllOrdersDuration.add(batch[1].timings.duration);

  check(batch[0], {
    "admin users fetch ok": (res) => res.status === 200,
  });
  check(batch[1], {
    "admin orders fetch ok": (res) => res.status === 200,
  });

  sleep(sleepRange(1, 3));
}

export function adminWriteFlow(data) {
  const allOrdersRes = http.get(`${BASE_URL}/api/v1/auth/all-orders`, {
    headers: { Authorization: data.adminToken },
    tags: { name: "admin_get_orders_for_status_update", flow: "admin-write" },
  });
  adminFetchOrdersForUpdateDuration.add(allOrdersRes.timings.duration);
  check(allOrdersRes, {
    "admin orders fetched for update": (res) => res.status === 200,
  });

  const orders = allOrdersRes.json() || [];
  if (orders.length > 0) {
    const targetOrder = orders[0];
    const updateRes = http.put(
      `${BASE_URL}/api/v1/auth/order-status/${targetOrder._id}`,
      JSON.stringify({ status: "Processing" }),
      jsonParams(data.adminToken, { name: "admin_update_order_status", flow: "admin-write" }),
    );
    adminOrderStatusUpdateDuration.add(updateRes.timings.duration);
    check(updateRes, {
      "admin order status update ok": (res) => res.status === 200,
    });
  }

  sleep(sleepRange(1, 3));
}
