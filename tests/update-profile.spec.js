import { test, expect } from "@playwright/test";

async function expectPath(page, expectedPath) {
  await expect
    .poll(() => new URL(page.url()).pathname)
    .toBe(expectedPath);
}

test("User can update profile details end-to-end", async ({ page }) => {
  // Huang Yi Chee, A0259617R

  const timestamp = Date.now();
  const originalName = `ProfileUser${timestamp}`;
  const updatedName = `UpdatedUser${timestamp}`;
  const userEmail = `profile${timestamp}@test.com`;
  const originalPassword = "OldPassword123!";
  const updatedPassword = "NewPassword456!";
  const originalPhone = "99988877";
  const updatedPhone = "81234567";
  const originalAddress = "NUS Computing";
  const updatedAddress = "Updated Address 123";
  const secretAnswer = "Tennis";

  await page.goto("/register");
  await page.getByPlaceholder(/Enter Your Name/i).fill(originalName);
  await page.getByPlaceholder(/Enter Your Email/i).fill(userEmail);
  await page.getByPlaceholder(/Enter Your Password/i).fill(originalPassword);
  await page.getByPlaceholder(/Enter Your Phone/i).fill(originalPhone);
  await page.getByPlaceholder(/Enter Your Address/i).fill(originalAddress);
  await page.getByPlaceholder(/Enter Your DOB/i).fill("2026-03-17");
  await page.getByPlaceholder(/What is Your Favorite sports/i).fill(secretAnswer);
  await page.getByRole("button", { name: /register/i }).click();

  await expectPath(page, "/login");

  await page.getByPlaceholder(/Enter Your Email/i).fill(userEmail);
  await page.getByPlaceholder(/Enter Your Password/i).fill(originalPassword);
  await page.getByRole("button", { name: /login/i }).click();

  await expectPath(page, "/");

  await page.getByRole("button", { name: originalName }).click();
  await page.getByRole("link", { name: /dashboard/i }).click();
  await page.getByRole("link", { name: /profile/i }).click();

  await expect.poll(() => new URL(page.url()).pathname).toContain("/profile");

  await expect(page.getByPlaceholder(/Enter Your Name/i)).toHaveValue(originalName);
  await expect(page.getByPlaceholder(/Enter Your Email/i)).toHaveValue(userEmail);
  await expect(page.getByPlaceholder(/Enter Your Phone/i)).toHaveValue(originalPhone);
  await expect(page.getByPlaceholder(/Enter Your Address/i)).toHaveValue(originalAddress);
  await expect(page.getByPlaceholder(/Enter Your Email/i)).toBeDisabled();

  await page.getByPlaceholder(/Enter Your Name/i).fill(updatedName);
  await page.getByPlaceholder(/Enter Your Password/i).fill(updatedPassword);
  await page.getByPlaceholder(/Enter Your Phone/i).fill(updatedPhone);
  await page.getByPlaceholder(/Enter Your Address/i).fill(updatedAddress);

  await page.getByRole("button", { name: /update/i }).click();

  await expect(page.getByText(/Profile Updated Successfully/i)).toBeVisible();

  await expect(page.getByPlaceholder(/Enter Your Name/i)).toHaveValue(updatedName);
  await expect(page.getByPlaceholder(/Enter Your Email/i)).toHaveValue(userEmail);
  await expect(page.getByPlaceholder(/Enter Your Phone/i)).toHaveValue(updatedPhone);
  await expect(page.getByPlaceholder(/Enter Your Address/i)).toHaveValue(updatedAddress);
});

test("Profile update is blocked when required fields are empty", async ({ page }) => {
  // Huang Yi Chee, A0259617R

  const timestamp = Date.now();
  const userName = `ProfileUser${timestamp}`;
  const userEmail = `profile${timestamp}@test.com`;
  const userPassword = "Password123!";
  const userPhone = "99988877";
  const userAddress = "NUS Computing";
  const secretAnswer = "Tennis";

  await page.goto("/register");
  await page.getByPlaceholder(/Enter Your Name/i).fill(userName);
  await page.getByPlaceholder(/Enter Your Email/i).fill(userEmail);
  await page.getByPlaceholder(/Enter Your Password/i).fill(userPassword);
  await page.getByPlaceholder(/Enter Your Phone/i).fill(userPhone);
  await page.getByPlaceholder(/Enter Your Address/i).fill(userAddress);
  await page.getByPlaceholder(/Enter Your DOB/i).fill("2026-03-17");
  await page.getByPlaceholder(/What is Your Favorite sports/i).fill(secretAnswer);
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

  await page.getByPlaceholder(/Enter Your Name/i).fill("   ");
  await page.getByRole("button", { name: /update/i }).click();

  await expect(page.getByText(/Name is required/i)).toBeVisible();
  await expect(page.getByPlaceholder(/Enter Your Email/i)).toHaveValue(userEmail);
});