import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const loginFailures = new Counter("login_failures");
const loginDuration = new Trend("login_duration");
const errorRate = new Rate("errors");

export const options = {
  stages: [
    { duration: "1m", target: 50 },  // warm up
    { duration: "2m", target: 100 }, // ramp — bcrypt is CPU-bound, this will hurt
    { duration: "2m", target: 200 }, // ramp
    { duration: "2m", target: 300 }, // ramp
    { duration: "4m", target: 300 }, // sustain peak
    { duration: "1m", target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<800"],
    http_req_failed: ["rate<0.02"],
    login_failures: ["count<10"],
  },
};

const BASE = "http://localhost:6060";

// Valid credentials — make sure this user exists after db:seed
const VALID_USER = { email: "user@example.com", password: "userpass" };

export default function () {
  // --- Login flow ---
  const loginRes = http.post(
    `${BASE}/api/v1/auth/login`,
    JSON.stringify(VALID_USER),
    { headers: { "Content-Type": "application/json" } }
  );

  loginDuration.add(loginRes.timings.duration);

  const loginOk = check(loginRes, {
    "login status 200": (r) => r.status === 200,
    "login returns token": (r) => {
      try {
        return r.json("token") !== undefined;
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!loginOk);
  if (!loginOk) {
    loginFailures.add(1);
    sleep(1);
    return;
  }

  // --- Wrong password (should get 200 with error, not 500) ---
  const badRes = http.post(
    `${BASE}/api/v1/auth/login`,
    JSON.stringify({ email: VALID_USER.email, password: "wrongpassword" }),
    {
      headers: { "Content-Type": "application/json" },
      responseCallback: http.expectedStatuses(200, 401),
    }
  );
  check(badRes, {
    "bad login does not 500": (r) => r.status !== 500,
  });

  // --- Forgot password (public, just hammers the route) ---
  const forgotRes = http.post(
    `${BASE}/api/v1/auth/forgot-password`,
    JSON.stringify({
      email: VALID_USER.email,
      answer: "test",
      newPassword: "userpass",
    }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(forgotRes, { "forgot-password responds": (r) => r.status < 500 });

  sleep(1);
}
