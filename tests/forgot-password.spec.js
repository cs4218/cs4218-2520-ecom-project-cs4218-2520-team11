import { test, expect } from "@playwright/test";

async function expectPath(page, expectedPath) {
  await expect
    .poll(() => new URL(page.url()).pathname)
    .toBe(expectedPath);
}

test("User can reset password and login with new credentials end-to-end", async ({ page }) => {
  // Huang Yi Chee, A0259617R

  const timestamp = Date.now();
  const userName = `ResetUser${timestamp}`;
  const userEmail = `reset${timestamp}@test.com`;
  const oldPassword = "OldPassword123!";
  const newPassword = "NewPassword456!";
  const secretAnswer = "Tennis";

  await page.goto("/register");
  await page.getByPlaceholder(/Enter Your Name/i).fill(userName);
  await page.getByPlaceholder(/Enter Your Email/i).fill(userEmail);
  await page.getByPlaceholder(/Enter Your Password/i).fill(oldPassword);
  await page.getByPlaceholder(/Enter Your Phone/i).fill("999888777");
  await page.getByPlaceholder(/Enter Your Address/i).fill("NUS Computing");
  await page.getByPlaceholder(/Enter Your DOB/i).fill("2026-03-17");
  await page.getByPlaceholder(/What is Your Favorite sports/i).fill(secretAnswer);
  await page.getByRole("button", { name: /register/i }).click();

  await expectPath(page, "/login");

  await page.getByRole("button", { name: /forgot password/i }).click();
  await expectPath(page, "/forgot-password");

  await page.getByPlaceholder(/Enter Your Email/i).fill(userEmail);
  await page.getByPlaceholder(/Enter Your Secret Answer/i).fill(secretAnswer);
  await page.getByPlaceholder(/Enter Your New Password/i).fill(newPassword);
  await page.getByRole("button", { name: /reset password/i }).click();

  await expectPath(page, "/login");

  await page.getByPlaceholder(/Enter Your Email/i).fill(userEmail);
  await page.getByPlaceholder(/Enter Your Password/i).fill(newPassword);
  await page.getByRole("button", { name: /login/i }).click();

  await expectPath(page, "/");

  await page.getByRole("button", { name: userName }).click();
  await page.getByRole("link", { name: /dashboard/i }).click();
  await page.getByRole("link", { name: /profile/i }).click();

  await expect.poll(() => new URL(page.url()).pathname).toContain("/profile");
  await expect(page.getByPlaceholder(/Enter Your Name/i)).toHaveValue(userName);
  await expect(page.getByPlaceholder(/Enter Your Email/i)).toHaveValue(userEmail);
});

test("Forgot password flow blocks reset with incorrect secret answer", async ({ page }) => {
  // Huang Yi Chee, A0259617R

  const timestamp = Date.now();
  const userEmail = `secure${timestamp}@test.com`;
  const secretAnswer = "Tennis";

  await page.goto("/register");
  await page.getByPlaceholder(/Enter Your Name/i).fill("Secure User");
  await page.getByPlaceholder(/Enter Your Email/i).fill(userEmail);
  await page.getByPlaceholder(/Enter Your Password/i).fill("Pass123!");
  await page.getByPlaceholder(/Enter Your Phone/i).fill("98765432");
  await page.getByPlaceholder(/Enter Your Address/i).fill("NUS Computing");
  await page.getByPlaceholder(/Enter Your DOB/i).fill("2026-03-17");
  await page.getByPlaceholder(/What is Your Favorite sports/i).fill(secretAnswer);
  await page.getByRole("button", { name: /register/i }).click();

  await expectPath(page, "/login");

  await page.goto("/forgot-password");
  await page.getByPlaceholder(/Enter Your Email/i).fill(userEmail);
  await page.getByPlaceholder(/Enter Your Secret Answer/i).fill("WrongAnswer!");
  await page.getByPlaceholder(/Enter Your New Password/i).fill("HackerPassword999!");
  await page.getByRole("button", { name: /reset password/i }).click();

  await expect(page.getByText(/Something went wrong/i)).toBeVisible();
  await expectPath(page, "/forgot-password");
});