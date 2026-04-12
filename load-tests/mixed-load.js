import http from "k6/http";
import { check, sleep } from "k6";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  BASE_URL,
  DEFAULT_THRESHOLDS,
  PAYMENT_NONCE,
  USER_ANSWER,
  USER_EMAIL,
  USER_PASSWORD,
  buildSyntheticCart,
  createAdminCategory,
  createAdminProduct,
  createRegisteredUser,
  getCatalogFixture,
  jsonParams,
  login,
  multipartParams,
  randomItem,
  sleepRange,
  uniqueSuffix,
} from "./scenarios/_shared.js";

/*
Load Test 9: Mixed Realistic Workload
Objective: Simulate a combined workload across browsing, search, auth,
checkout, and admin activity using the actual Virtual Vault API surface.
*/

// Huang Yi Chee, A0259617R

export const options = {
  scenarios: {
    browseAndSearch: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "3m", target: 70 },
        { duration: "20m", target: 70 },
        { duration: "1m", target: 0 },
      ],
      exec: "browseAndSearchFlow",
    },
    authAndCheckout: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "3m", target: 20 },
        { duration: "20m", target: 20 },
        { duration: "1m", target: 0 },
      ],
      exec: "authAndCheckoutFlow",
    },
    adminTraffic: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "3m", target: 10 },
        { duration: "20m", target: 10 },
        { duration: "1m", target: 0 },
      ],
      exec: "adminTrafficFlow",
    },
  },
  thresholds: DEFAULT_THRESHOLDS,
  summaryTrendStats: ["avg", "med", "p(90)", "p(95)", "p(99)", "max"],
};

export function setup() {
  const fixture = getCatalogFixture();

  let shopper;
  if (USER_EMAIL && USER_PASSWORD) {
    shopper = login(USER_EMAIL, USER_PASSWORD, "mixed_user_login_setup");
    shopper.answer = USER_ANSWER;
  } else {
    shopper = createRegisteredUser("k6-mixed-user");
  }

  let admin = null;
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    admin = login(ADMIN_EMAIL, ADMIN_PASSWORD, "mixed_admin_login_setup");
  }

  let adminCategory = null;
  let adminProduct = null;
  if (admin) {
    adminCategory = createAdminCategory(admin.token);
    adminProduct = createAdminProduct(admin.token, adminCategory._id);
  }

  return {
    categories: fixture.categories,
    products: fixture.products,
    shopperToken: shopper.token,
    shopperEmail: shopper.email,
    shopperPassword: shopper.password || USER_PASSWORD,
    shopperAnswer: shopper.answer,
    cart: buildSyntheticCart(fixture.products),
    adminToken: admin ? admin.token : "",
    adminCategoryId: adminCategory ? adminCategory._id : "",
    adminProductId: adminProduct ? adminProduct._id : "",
    adminProductName: adminProduct ? adminProduct.name : "",
  };
}

function browseAndSearch(data) {
  const mix = Math.random();
  const product = randomItem(data.products);

  if (mix < 0.35) {
    const listRes = http.get(`${BASE_URL}/api/v1/product/product-list/1`, {
      tags: { name: "mixed_product_list", flow: "browse" },
    });
    check(listRes, {
      "mixed product list ok": (res) => res.status === 200,
    });
  } else if (mix < 0.55) {
    const detailRes = http.get(
      `${BASE_URL}/api/v1/product/get-product/${product.slug}`,
      {
        tags: { name: "mixed_product_details", flow: "browse" },
      },
    );
    check(detailRes, {
      "mixed product details ok": (res) => res.status === 200,
    });
  } else if (mix < 0.75) {
    const searchRes = http.get(
      `${BASE_URL}/api/v1/product/search/${encodeURIComponent(product.name)}`,
      {
        tags: { name: "mixed_product_search", flow: "search" },
      },
    );
    check(searchRes, {
      "mixed product search ok": (res) => res.status === 200,
    });
  } else {
    const category = randomItem(data.categories);
    const filterRes = http.post(
      `${BASE_URL}/api/v1/product/product-filters`,
      JSON.stringify({
        checked: [category._id],
        radio: [0, 2000],
      }),
      jsonParams(undefined, { name: "mixed_product_filters", flow: "search" }),
    );
    check(filterRes, {
      "mixed product filters ok": (res) => res.status === 200,
    });
  }
}

function authAndCheckout(data) {
  const mix = Math.random();

  if (mix < 0.35) {
    const loginRes = http.post(
      `${BASE_URL}/api/v1/auth/login`,
      JSON.stringify({
        email: data.shopperEmail,
        password: data.shopperPassword,
      }),
      jsonParams(undefined, { name: "mixed_auth_login", flow: "auth" }),
    );
    check(loginRes, {
      "mixed auth login ok": (res) => res.status === 200,
    });
  } else if (mix < 0.65) {
    const ordersRes = http.get(`${BASE_URL}/api/v1/auth/orders`, {
      headers: { Authorization: data.shopperToken },
      tags: { name: "mixed_user_orders", flow: "user" },
    });
    check(ordersRes, {
      "mixed user orders ok": (res) => res.status === 200,
    });
  } else if (mix < 0.85) {
    const tokenRes = http.get(`${BASE_URL}/api/v1/product/braintree/token`, {
      tags: { name: "mixed_braintree_token", flow: "checkout" },
    });
    check(tokenRes, {
      "mixed braintree token ok": (res) => res.status === 200 || res.status === 500,
    });
  } else if (PAYMENT_NONCE) {
    const paymentRes = http.post(
      `${BASE_URL}/api/v1/product/braintree/payment`,
      JSON.stringify({
        nonce: PAYMENT_NONCE,
        cart: data.cart,
      }),
      jsonParams(data.shopperToken, { name: "mixed_braintree_payment", flow: "checkout" }),
    );
    check(paymentRes, {
      "mixed payment ok": (res) => res.status === 200,
    });
  } else {
    const profileRes = http.put(
      `${BASE_URL}/api/v1/auth/profile`,
      JSON.stringify({
        name: "K6 Mixed User",
        email: data.shopperEmail,
        phone: "81234567",
        address: "1 Computing Drive",
        password: "",
      }),
      jsonParams(data.shopperToken, { name: "mixed_profile_update", flow: "user" }),
    );
    check(profileRes, {
      "mixed profile update ok": (res) => res.status === 200,
    });
  }
}

function adminTraffic(data) {
  if (!data.adminToken) {
    const ordersRes = http.get(`${BASE_URL}/api/v1/auth/orders`, {
      headers: { Authorization: data.shopperToken },
      tags: { name: "mixed_fallback_orders", flow: "user" },
    });
    check(ordersRes, {
      "mixed fallback orders ok": (res) => res.status === 200,
    });
    return;
  }

  const mix = Math.random();

  if (mix < 0.5) {
    const batch = http.batch([
      [
        "GET",
        `${BASE_URL}/api/v1/auth/all-users`,
        null,
        { headers: { Authorization: data.adminToken }, tags: { name: "mixed_admin_users", flow: "admin" } },
      ],
      [
        "GET",
        `${BASE_URL}/api/v1/auth/all-orders`,
        null,
        { headers: { Authorization: data.adminToken }, tags: { name: "mixed_admin_orders", flow: "admin" } },
      ],
    ]);

    check(batch[0], {
      "mixed admin users ok": (res) => res.status === 200,
    });
    check(batch[1], {
      "mixed admin orders ok": (res) => res.status === 200,
    });
  } else if (mix < 0.75) {
    const updateRes = http.put(
      `${BASE_URL}/api/v1/product/update-product/${data.adminProductId}`,
      {
        name: `${data.adminProductName}-${uniqueSuffix()}`.slice(0, 80),
        description: `Mixed update ${uniqueSuffix()}`,
        price: "22.99",
        quantity: "20",
        category: data.adminCategoryId,
        shipping: "1",
        photo: http.file("mixed admin update payload", `mixed-${uniqueSuffix()}.png`, "image/png"),
      },
      multipartParams(data.adminToken, { name: "mixed_admin_update_product", flow: "admin" }),
    );
    check(updateRes, {
      "mixed admin update product ok": (res) => res.status === 201,
    });
  } else {
    const allOrdersRes = http.get(`${BASE_URL}/api/v1/auth/all-orders`, {
      headers: { Authorization: data.adminToken },
      tags: { name: "mixed_admin_fetch_orders_for_update", flow: "admin" },
    });
    check(allOrdersRes, {
      "mixed admin fetch orders for update ok": (res) => res.status === 200,
    });

    const orders = allOrdersRes.json() || [];
    if (orders.length > 0) {
      const statusRes = http.put(
        `${BASE_URL}/api/v1/auth/order-status/${orders[0]._id}`,
        JSON.stringify({ status: "Processing" }),
        jsonParams(data.adminToken, { name: "mixed_admin_order_status", flow: "admin" }),
      );
      check(statusRes, {
        "mixed admin order status ok": (res) => res.status === 200,
      });
    }
  }
}

export function browseAndSearchFlow(data) {
  browseAndSearch(data);

  sleep(sleepRange(1, 3));
}

export function authAndCheckoutFlow(data) {
  authAndCheckout(data);

  sleep(sleepRange(1, 3));
}

export function adminTrafficFlow(data) {
  adminTraffic(data);

  sleep(sleepRange(1, 3));
}
