import http from "k6/http";
import { check, sleep } from "k6";
import exec from "k6/execution";
import {
  BASE_URL,
  DEFAULT_THRESHOLDS,
  USER_ANSWER,
  USER_EMAIL,
  USER_PASSWORD,
  createRegisteredUser,
  jsonParams,
  sleepRange,
  uniqueSuffix,
} from "./_shared.js";

/*
Load Test 3: Authentication Flow
Objective: Exercise registration, login, and forgot-password traffic using real
controller validation paths and JWT issuance.
*/

// Huang Yi Chee, A0259617R

export const options = {
  scenarios: {
    register: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 6 },
        { duration: "5m", target: 6 },
        { duration: "30s", target: 0 },
      ],
      exec: "registerFlow",
    },
    login: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 21 },
        { duration: "5m", target: 21 },
        { duration: "30s", target: 0 },
      ],
      exec: "loginFlow",
    },
    recovery: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 3 },
        { duration: "5m", target: 3 },
        { duration: "30s", target: 0 },
      ],
      exec: "recoveryFlow",
    },
  },
  thresholds: DEFAULT_THRESHOLDS,
  summaryTrendStats: ["avg", "med", "p(90)", "p(95)", "p(99)", "max"],
};

export function setup() {
  const fallbackUser = USER_EMAIL && USER_PASSWORD
    ? { email: USER_EMAIL, password: USER_PASSWORD, answer: USER_ANSWER }
    : createRegisteredUser("k6-auth-seed");

  return { fallbackUser };
}

export function registerFlow() {
  const suffix = uniqueSuffix();
  const payload = {
    name: `K6 Register ${suffix}`,
    email: `k6-register-${suffix}@example.com`,
    password: `Pass-${suffix}!`,
    phone: "90000000",
    address: "Load Test Street",
    DOB: "2000-01-01",
    answer: `answer-${suffix}`,
  };

  const registerRes = http.post(
    `${BASE_URL}/api/v1/auth/register`,
    JSON.stringify(payload),
    jsonParams(undefined, { name: "auth_register", flow: "register" }),
  );
  check(registerRes, {
    "register accepted": (res) => res.status === 201,
  });

  sleep(sleepRange(1, 2));
}

export function loginFlow(data) {
  const loginRes = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({
      email: data.fallbackUser.email,
      password: data.fallbackUser.password,
    }),
    jsonParams(undefined, { name: "auth_login", flow: "login" }),
  );
  check(loginRes, {
    "login accepted": (res) => res.status === 200,
    "login returned token": (res) => !!res.json("token"),
  });

  sleep(sleepRange(1, 2));
}

export function recoveryFlow() {
  const resetUser = createRegisteredUser("k6-auth-reset");
  const iterationKey = `${exec.vu.idInTest}-${exec.scenario.iterationInTest}`;
  const nextPassword = `Reset-${iterationKey}!`;

  const forgotRes = http.post(
    `${BASE_URL}/api/v1/auth/forgot-password`,
    JSON.stringify({
      email: resetUser.email,
      answer: resetUser.answer,
      newPassword: nextPassword,
    }),
    jsonParams(undefined, { name: "auth_forgot_password", flow: "recovery" }),
  );
  check(forgotRes, {
    "forgot-password accepted": (res) => res.status === 200,
  });

  sleep(sleepRange(1, 2));
}
