import { test, expect } from "@playwright/test";

async function expectPath(page, expectedPath) {
  await expect
    .poll(() => new URL(page.url()).pathname)
    .toBe(expectedPath);
}

test("User can register, login, and view profile end-to-end", async ({ page }) => {
  // Huang Yi Chee, A0259617R

  const timestamp = Date.now();
  const userName = `Tester${timestamp}`;
  const userEmail = `tester${timestamp}@test.com`;
  const userPassword = "Password123!";

  await page.goto("/");
  await page.getByRole("link", { name: /register/i }).click();
  await expectPath(page, "/register");

  await page.getByPlaceholder(/Enter Your Name/i).fill(userName);
  await page.getByPlaceholder(/Enter Your Email/i).fill(userEmail);
  await page.getByPlaceholder(/Enter Your Password/i).fill(userPassword);
  await page.getByPlaceholder(/Enter Your Phone/i).fill("999888777");
  await page.getByPlaceholder(/Enter Your Address/i).fill("NUS Computing");
  await page.getByPlaceholder(/Enter Your DOB/i).fill("2026-03-17");
  await page.getByPlaceholder(/What is Your Favorite sports/i).fill("Tennis");

  await page.getByRole("button", { name: /register/i }).click();
  await expectPath(page, "/login");

  await page.getByPlaceholder(/Enter Your Email/i).fill(userEmail);
  await page.getByPlaceholder(/Enter Your Password/i).fill(userPassword);
  await page.getByRole("button", { name: /login/i }).click();

  await expectPath(page, "/");

  await page.getByRole("button", { name: userName }).click();
  await page.getByRole("link", { name: /dashboard/i }).click();
  await page.getByRole("link", { name: /profile/i }).click();

  await expect.poll(() => new URL(page.url()).pathname).toContain("/profile");

  await expect(page.getByPlaceholder(/Enter Your Name/i)).toHaveValue(userName);
  await expect(page.getByPlaceholder(/Enter Your Email/i)).toHaveValue(userEmail);
  await expect(page.getByPlaceholder(/Enter Your Email/i)).toBeDisabled();
});

test("Login with bad credentials prevents access and shows error", async ({ page }) => {
  // Huang Yi Chee, A0259617R

  await page.goto("/login");

  await page.getByPlaceholder(/Enter Your Email/i).fill("fake-user-999@test.com");
  await page.getByPlaceholder(/Enter Your Password/i).fill("WrongPassword123!");
  await page.getByRole("button", { name: /login/i }).click();

  await expect(page.getByText(/Something went wrong/i)).toBeVisible();
  await expectPath(page, "/login");
});

test("Unauthenticated users are redirected away from protected routes", async ({ page }) => {
  // Huang Yi Chee, A0259617R

  await page.goto("/dashboard/user/profile");
  await expectPath(page, "/");
});

test("Duplicate user registration is blocked gracefully", async ({ page }) => {
  // Huang Yi Chee, A0259617R

  const timestamp = Date.now();
  const duplicateEmail = `duplicate${timestamp}@test.com`;

  await page.goto("/register");
  await page.getByPlaceholder(/Enter Your Name/i).fill("First User");
  await page.getByPlaceholder(/Enter Your Email/i).fill(duplicateEmail);
  await page.getByPlaceholder(/Enter Your Password/i).fill("Pass123!");
  await page.getByPlaceholder(/Enter Your Phone/i).fill("98765432");
  await page.getByPlaceholder(/Enter Your Address/i).fill("NUS Computing");
  await page.getByPlaceholder(/Enter Your DOB/i).fill("2026-03-17");
  await page.getByPlaceholder(/What is Your Favorite sports/i).fill("Tennis");
  await page.getByRole("button", { name: /register/i }).click();

  await expectPath(page, "/login");

  await page.goto("/register");
  await page.getByPlaceholder(/Enter Your Name/i).fill("Second User");
  await page.getByPlaceholder(/Enter Your Email/i).fill(duplicateEmail);
  await page.getByPlaceholder(/Enter Your Password/i).fill("Pass123!");
  await page.getByPlaceholder(/Enter Your Phone/i).fill("98765432");
  await page.getByPlaceholder(/Enter Your Address/i).fill("NUS Computing");
  await page.getByPlaceholder(/Enter Your DOB/i).fill("2026-03-17");
  await page.getByPlaceholder(/What is Your Favorite sports/i).fill("Tennis");
  await page.getByRole("button", { name: /register/i }).click();

  await expect(page.getByText(/Something went wrong/i)).toBeVisible();
  await expectPath(page, "/register");
});