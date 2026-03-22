/**
 * E2E UI tests – User Registration, Login & Forgot Password Flow
 *
 * Strategy:
 *   - All three pages are public (no PrivateRoute guard).
 *   - Intercept API endpoints with page.route() for deterministic results.
 *   - Verify form interactions, API call payloads, toasts, and navigation.
 *
 * Flows verified:
 *   1. Register form interaction: fill 7 fields, submit, verify API payload, navigate to /login.
 *   2. Register error handling: API failure → toast; success=false → server message.
 *   3. Login form interaction: fill email/password, submit, verify auth stored & redirect.
 *   4. Login error paths: API failure toast; invalid credentials toast.
 *   5. Forgot Password flow: fill email/answer/newPassword, submit, navigate to /login.
 *   6. Cross-component integration: register → land on login page → login → redirect to home.
 *
 * Run:
 *   npx playwright test tests/auth.spec.js
 */

import { test, expect } from "@playwright/test";

// ─── Mock data ────────────────────────────────────────────────────────────────

const REGISTER_DATA = {
  name: "Jane Test",
  email: "jane@test.com",
  password: "securePass123",
  phone: "9876543210",
  address: "456 Test Blvd",
  DOB: "2000-01-15",
  answer: "Basketball",
};

const LOGIN_DATA = {
  email: "john@test.com",
  password: "testPassword123",
};

const MOCK_LOGIN_RESPONSE = {
  success: true,
  message: "Login successful",
  user: {
    _id: "user-1",
    name: "John Doe",
    email: "john@test.com",
    phone: "1234567890",
    address: "123 Test St",
    role: 0,
  },
  token: "fake-jwt-token",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function stubCommonApis(page) {
  await page.route(/\/api\/v1\/product\/product-photo\//, (route) =>
    route.fulfill({ status: 200, contentType: "image/png", body: "" })
  );

  await page.route("**/api/v1/category/get-category", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, category: [] }),
    })
  );

  await page.route("**/api/v1/product/braintree/token", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ clientToken: "" }),
    })
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1 & 2: Register Page
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Register Page", () => {
  test.beforeEach(async ({ page }) => {
    await stubCommonApis(page);
  });

  test("fills all 7 fields, submits, and navigates to /login on success", async ({
    page,
  }) => {
    let capturedPayload = null;
    await page.route("**/api/v1/auth/register", (route) => {
      capturedPayload = route.request().postDataJSON();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "User registered successfully",
        }),
      });
    });

    await page.goto("/register");
    await page.waitForLoadState("networkidle");

    // Fill all 7 fields
    await page.getByPlaceholder("Enter Your Name").fill(REGISTER_DATA.name);
    // Note: Register's email placeholder has trailing space
    await page.getByPlaceholder("Enter Your Email").fill(REGISTER_DATA.email);
    await page
      .getByPlaceholder("Enter Your Password")
      .fill(REGISTER_DATA.password);
    await page.getByPlaceholder("Enter Your Phone").fill(REGISTER_DATA.phone);
    await page
      .getByPlaceholder("Enter Your Address")
      .fill(REGISTER_DATA.address);
    await page.locator("#exampleInputDOB1").fill(REGISTER_DATA.DOB);
    await page
      .getByPlaceholder("What is Your Favorite sports")
      .fill(REGISTER_DATA.answer);

    // Submit
    await page.getByRole("button", { name: "REGISTER" }).click();

    // Verify API payload
    await expect.poll(() => capturedPayload).toBeTruthy();
    expect(capturedPayload.name).toBe(REGISTER_DATA.name);
    expect(capturedPayload.email).toBe(REGISTER_DATA.email);
    expect(capturedPayload.password).toBe(REGISTER_DATA.password);
    expect(capturedPayload.phone).toBe(REGISTER_DATA.phone);
    expect(capturedPayload.address).toBe(REGISTER_DATA.address);
    expect(capturedPayload.DOB).toBe(REGISTER_DATA.DOB);
    expect(capturedPayload.answer).toBe(REGISTER_DATA.answer);

    // Should navigate to /login
    await page.waitForURL("**/login");

    // Success toast
    await expect(
      page.getByText("Register Successfully, please login")
    ).toBeVisible({ timeout: 10000 });
  });

  test("shows error toast when API call fails", async ({ page }) => {
    await page.route("**/api/v1/auth/register", (route) =>
      route.fulfill({ status: 500, body: "Internal Server Error" })
    );

    await page.goto("/register");
    await page.waitForLoadState("networkidle");

    // Fill required fields
    await page.getByPlaceholder("Enter Your Name").fill(REGISTER_DATA.name);
    await page.getByPlaceholder("Enter Your Email").fill(REGISTER_DATA.email);
    await page
      .getByPlaceholder("Enter Your Password")
      .fill(REGISTER_DATA.password);
    await page.getByPlaceholder("Enter Your Phone").fill(REGISTER_DATA.phone);
    await page
      .getByPlaceholder("Enter Your Address")
      .fill(REGISTER_DATA.address);
    await page.locator("#exampleInputDOB1").fill(REGISTER_DATA.DOB);
    await page
      .getByPlaceholder("What is Your Favorite sports")
      .fill(REGISTER_DATA.answer);

    await page.getByRole("button", { name: "REGISTER" }).click();

    await expect(page.getByText("Something went wrong")).toBeVisible({
      timeout: 10000,
    });
  });

  test("shows server error message when success is false", async ({
    page,
  }) => {
    await page.route("**/api/v1/auth/register", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "User already exists",
        }),
      })
    );

    await page.goto("/register");
    await page.waitForLoadState("networkidle");

    await page.getByPlaceholder("Enter Your Name").fill(REGISTER_DATA.name);
    await page.getByPlaceholder("Enter Your Email").fill(REGISTER_DATA.email);
    await page
      .getByPlaceholder("Enter Your Password")
      .fill(REGISTER_DATA.password);
    await page.getByPlaceholder("Enter Your Phone").fill(REGISTER_DATA.phone);
    await page
      .getByPlaceholder("Enter Your Address")
      .fill(REGISTER_DATA.address);
    await page.locator("#exampleInputDOB1").fill(REGISTER_DATA.DOB);
    await page
      .getByPlaceholder("What is Your Favorite sports")
      .fill(REGISTER_DATA.answer);

    await page.getByRole("button", { name: "REGISTER" }).click();

    await expect(page.getByText("User already exists")).toBeVisible({
      timeout: 10000,
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3 & 4: Login Page
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await stubCommonApis(page);
  });

  test("fills email and password, submits, and redirects to home on success", async ({
    page,
  }) => {
    // Stub homepage APIs so it loads cleanly after redirect
    await page.route("**/api/v1/product/product-list/*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ products: [] }),
      })
    );
    await page.route("**/api/v1/product/product-count", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ total: 0 }),
      })
    );

    let capturedPayload = null;
    await page.route("**/api/v1/auth/login", (route) => {
      capturedPayload = route.request().postDataJSON();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_LOGIN_RESPONSE),
      });
    });

    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Fill login form — Note: Login placeholder has trailing space "Enter Your Email "
    await page.getByPlaceholder("Enter Your Email").fill(LOGIN_DATA.email);
    await page
      .getByPlaceholder("Enter Your Password")
      .fill(LOGIN_DATA.password);

    // Submit
    await page.getByRole("button", { name: "LOGIN" }).click();

    // Verify API payload
    await expect.poll(() => capturedPayload).toBeTruthy();
    expect(capturedPayload.email).toBe(LOGIN_DATA.email);
    expect(capturedPayload.password).toBe(LOGIN_DATA.password);

    // Should redirect to home "/"
    await page.waitForURL(/\/$/);

    // Auth should be stored in localStorage
    const authData = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("auth"))
    );
    expect(authData.token).toBe(MOCK_LOGIN_RESPONSE.token);
    expect(authData.user.name).toBe(MOCK_LOGIN_RESPONSE.user.name);
  });

  test("shows error toast when API call fails", async ({ page }) => {
    await page.route("**/api/v1/auth/login", (route) =>
      route.fulfill({ status: 500, body: "Internal Server Error" })
    );

    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.getByPlaceholder("Enter Your Email").fill(LOGIN_DATA.email);
    await page
      .getByPlaceholder("Enter Your Password")
      .fill(LOGIN_DATA.password);
    await page.getByRole("button", { name: "LOGIN" }).click();

    await expect(page.getByText("Something went wrong")).toBeVisible({
      timeout: 10000,
    });
  });

  test("shows server error message when credentials are invalid", async ({
    page,
  }) => {
    await page.route("**/api/v1/auth/login", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "Invalid email or password",
        }),
      })
    );

    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.getByPlaceholder("Enter Your Email").fill(LOGIN_DATA.email);
    await page
      .getByPlaceholder("Enter Your Password")
      .fill(LOGIN_DATA.password);
    await page.getByRole("button", { name: "LOGIN" }).click();

    await expect(page.getByText("Invalid email or password")).toBeVisible({
      timeout: 10000,
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5: Forgot Password Page
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Forgot Password Page", () => {
  test.beforeEach(async ({ page }) => {
    await stubCommonApis(page);
  });

  test("fills email, answer, and new password, submits, and navigates to /login", async ({
    page,
  }) => {
    let capturedPayload = null;
    await page.route("**/api/v1/auth/forgot-password", (route) => {
      capturedPayload = route.request().postDataJSON();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Password reset successfully",
        }),
      });
    });

    await page.goto("/forgot-password");
    await page.waitForLoadState("networkidle");

    // Fill the reset form
    await page
      .getByPlaceholder("Enter Your Email")
      .fill("john@test.com");
    await page
      .getByPlaceholder("Enter Your Secret Answer")
      .fill("Basketball");
    await page
      .getByPlaceholder("Enter Your New Password")
      .fill("newSecurePass456");

    // Submit
    await page.getByRole("button", { name: "RESET PASSWORD" }).click();

    // Verify API payload
    await expect.poll(() => capturedPayload).toBeTruthy();
    expect(capturedPayload.email).toBe("john@test.com");
    expect(capturedPayload.answer).toBe("Basketball");
    expect(capturedPayload.newPassword).toBe("newSecurePass456");

    // Should navigate to /login
    await page.waitForURL("**/login");

    // Success toast
    await expect(
      page.getByText("Password reset successfully")
    ).toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6: Cross-component integration
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Auth Flow Integration", () => {
  test.beforeEach(async ({ page }) => {
    await stubCommonApis(page);
  });

  test("register → navigate to login → login → redirect to home", async ({
    page,
  }) => {
    // Stub homepage APIs
    await page.route("**/api/v1/product/product-list/*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ products: [] }),
      })
    );
    await page.route("**/api/v1/product/product-count", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ total: 0 }),
      })
    );

    // Mock register endpoint
    await page.route("**/api/v1/auth/register", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "User registered successfully",
        }),
      })
    );

    // Mock login endpoint
    await page.route("**/api/v1/auth/login", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_LOGIN_RESPONSE),
      })
    );

    // Step 1: Register
    await page.goto("/register");
    await page.waitForLoadState("networkidle");

    await page.getByPlaceholder("Enter Your Name").fill(REGISTER_DATA.name);
    await page.getByPlaceholder("Enter Your Email").fill(REGISTER_DATA.email);
    await page
      .getByPlaceholder("Enter Your Password")
      .fill(REGISTER_DATA.password);
    await page.getByPlaceholder("Enter Your Phone").fill(REGISTER_DATA.phone);
    await page
      .getByPlaceholder("Enter Your Address")
      .fill(REGISTER_DATA.address);
    await page.locator("#exampleInputDOB1").fill(REGISTER_DATA.DOB);
    await page
      .getByPlaceholder("What is Your Favorite sports")
      .fill(REGISTER_DATA.answer);

    await page.getByRole("button", { name: "REGISTER" }).click();

    // Should land on /login
    await page.waitForURL("**/login");
    await expect(page.getByText("LOGIN FORM")).toBeVisible();

    // Step 2: Login (we're already on /login)
    await page
      .getByPlaceholder("Enter Your Email")
      .fill(LOGIN_DATA.email);
    await page
      .getByPlaceholder("Enter Your Password")
      .fill(LOGIN_DATA.password);

    await page.getByRole("button", { name: "LOGIN" }).click();

    // Should redirect to home
    await page.waitForURL(/\/$/);
  });
});
