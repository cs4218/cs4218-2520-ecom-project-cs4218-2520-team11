import http from "k6/http";
import { check, fail, sleep } from "k6";
import {
  BASE_URL,
  DEFAULT_THRESHOLDS,
  PAYMENT_NONCE,
  USER_ANSWER,
  USER_EMAIL,
  USER_PASSWORD,
  buildSyntheticCart,
  createRegisteredUser,
  getCatalogFixture,
  jsonParams,
  login,
  sleepRange,
} from "./_shared.js";

/*
Load Test 5: Cart, Checkout, and Payments
Objective: Validate payment token generation and payment processing requests
under expected checkout traffic.
*/

// Huang Yi Chee, A0259617R

export const options = {
  scenarios: {
    token: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 10 },
        { duration: "15m", target: 10 },
        { duration: "30s", target: 0 },
      ],
      exec: "tokenFlow",
    },
    payment: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 10 },
        { duration: "15m", target: 10 },
        { duration: "30s", target: 0 },
      ],
      exec: "paymentFlow",
    },
  },
  thresholds: DEFAULT_THRESHOLDS,
  summaryTrendStats: ["avg", "med", "p(90)", "p(95)", "p(99)", "max"],
};

export function setup() {
  const fixture = getCatalogFixture();

  let auth;
  if (USER_EMAIL && USER_PASSWORD) {
    auth = login(USER_EMAIL, USER_PASSWORD, "checkout_login_setup");
  } else {
    auth = createRegisteredUser("k6-checkout");
  }

  const cart = buildSyntheticCart(fixture.products);

  if (!cart.length) {
    fail("checkout scenario could not build a synthetic cart from seeded products");
  }

  return {
    token: auth.token,
    email: auth.email,
    password: auth.password || USER_PASSWORD,
    answer: auth.answer || USER_ANSWER,
    cart,
  };
}

export function tokenFlow() {
  const tokenRes = http.get(`${BASE_URL}/api/v1/product/braintree/token`, {
    tags: { name: "checkout_get_braintree_token", flow: "token" },
  });
  check(tokenRes, {
    "braintree token ok": (res) => res.status === 200,
  });

  sleep(sleepRange(1, 3));
}

export function paymentFlow(data) {
  if (!PAYMENT_NONCE) {
    fail("Load Test 5 requires K6_PAYMENT_NONCE to exercise /braintree/payment.");
  }

  const paymentRes = http.post(
    `${BASE_URL}/api/v1/product/braintree/payment`,
    JSON.stringify({
      nonce: PAYMENT_NONCE,
      cart: data.cart,
    }),
    jsonParams(data.token, { name: "checkout_braintree_payment", flow: "payment" }),
  );
  check(paymentRes, {
    "payment accepted": (res) => res.status === 200,
  });

  sleep(sleepRange(1, 3));
}
