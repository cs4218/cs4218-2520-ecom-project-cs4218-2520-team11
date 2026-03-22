/**
 * E2E UI tests – Category Browsing, Shared Navigation, and Admin Category Management
 *
 * Strategy:
 *   - Exercise complete user-facing journeys through the UI.
 *   - Mock browser-facing API responses so the tests stay stable and do not
 *     depend on mutable database contents or external payment services.
 *   - Keep the flows black-box from the end-user perspective by asserting only
 *     on visible navigation outcomes, page content, and route transitions.
 *
 * Flows verified:
 *   1. General shared navigation flow:
 *      User opens the home page → navigates to the categories page
 *      → opens the About page from the footer
 *      → visits an invalid route and sees the 404 page
 *      → uses "Go Back" to return to the home page.
 *
 *   2. Category browsing flow:
 *      User opens the categories page → selects a category
 *      → views products in that category
 *      → opens a product via "More Details"
 *      → verifies the product details page and related products section.
 *
 *   3. Admin category management flow:
 *      Authenticated admin opens the admin dashboard
 *      → verifies dashboard profile details
 *      → navigates to Manage Category
 *      → creates a new category
 *      → verifies the category appears in the category table.
 *
 *   4. Protected route redirect flow:
 *      Unauthenticated user attempts to access the admin dashboard
 *      → sees the redirect spinner
 *      → is redirected to the login page.
 *
 * Run:
 *   npm start --prefix client
 *   npx.cmd playwright test tests/category-admin-navigation.spec.js --config playwright.config.js
 */

import { test, expect } from "@playwright/test";

const MOCK_CATEGORIES = [
  { _id: "cat-1", name: "Electronics", slug: "electronics" },
  { _id: "cat-2", name: "Accessories", slug: "accessories" },
];

const MOCK_CATEGORY_PRODUCT = {
  _id: "prod-1",
  name: "Noise Cancelling Headphones",
  slug: "noise-cancelling-headphones",
  description: "Wireless headphones with active noise cancellation",
  price: 199,
  quantity: 5,
  category: MOCK_CATEGORIES[0],
};

const MOCK_RELATED_PRODUCT = {
  _id: "prod-2",
  name: "Travel Earbuds",
  slug: "travel-earbuds",
  description: "Compact earbuds for daily commuting and quick listening",
  price: 79,
  quantity: 8,
  category: MOCK_CATEGORIES[0],
};

const ADMIN_AUTH = {
  user: {
    name: "Admin User",
    email: "admin@example.com",
    phone: "91234567",
    address: "1 Admin Street",
    role: 1,
  },
  token: "admin-token",
};

function json(body, status = 200) {
  return {
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  };
}

async function mockCommonUiApis(page, categories = MOCK_CATEGORIES) {
  await page.route("**/api/v1/category/get-category", async (route) => {
    await route.fulfill(json({ success: true, category: categories }));
  });

  await page.route("**/api/v1/product/product-count", async (route) => {
    await route.fulfill(json({ total: 0 }));
  });

  await page.route("**/api/v1/product/product-list/*", async (route) => {
    await route.fulfill(json({ products: [] }));
  });

  await page.route("**/api/v1/product/product-photo/*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "image/png",
      body: "",
    });
  });
}

async function seedAdminSession(page) {
  await page.addInitScript((auth) => {
    window.localStorage.setItem("auth", JSON.stringify(auth));
  }, ADMIN_AUTH);
}

test.describe("Zyon scope E2E flows", () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonUiApis(page);
  });

  // Zyon Aaronel Wee Zhun Wei, A0277598B
  test("navigates through categories, footer pages, and 404 recovery as an end user", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: /categories/i })).toBeVisible();
    await expect(page.locator(".footer")).toBeVisible();

    await page.goto("/categories");
    await expect(page).toHaveURL(/\/categories$/);
    await expect(page).toHaveTitle("All Categories");
    await expect(
      page.getByRole("link", { name: MOCK_CATEGORIES[0].name }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: MOCK_CATEGORIES[1].name }),
    ).toBeVisible();

    await page.locator(".footer").getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page).toHaveTitle("About us - Ecommerce app");
    await expect(page.getByText("Add text")).toBeVisible();

    await page.goto("/route-that-does-not-exist");
    await expect(page).toHaveTitle("go back- page not found");
    await expect(
      page.getByRole("heading", { name: "Oops ! Page Not Found" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Go Back" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "All Products" })).toBeVisible();
  });

  // Zyon Aaronel Wee Zhun Wei, A0277598B
  test("browses a category and drills into product details from the category listing", async ({
    page,
  }) => {
    await page.route("**/api/v1/product/product-category/electronics", async (route) => {
      await route.fulfill(
        json({
          success: true,
          category: MOCK_CATEGORIES[0],
          products: [MOCK_CATEGORY_PRODUCT],
        }),
      );
    });

    await page.route(
      `**/api/v1/product/get-product/${MOCK_CATEGORY_PRODUCT.slug}`,
      async (route) => {
        await route.fulfill(
          json({
            success: true,
            product: MOCK_CATEGORY_PRODUCT,
          }),
        );
      },
    );

    await page.route(
      `**/api/v1/product/related-product/${MOCK_CATEGORY_PRODUCT._id}/${MOCK_CATEGORIES[0]._id}`,
      async (route) => {
        await route.fulfill(
          json({
            success: true,
            products: [MOCK_RELATED_PRODUCT],
          }),
        );
      },
    );

    await page.goto("/categories");
    await page.getByRole("link", { name: MOCK_CATEGORIES[0].name }).click();

    await expect(page).toHaveURL(/\/category\/electronics$/);
    await expect(
      page.getByRole("heading", { name: `Category - ${MOCK_CATEGORIES[0].name}` }),
    ).toBeVisible();
    await expect(page.getByText("1 result found")).toBeVisible();
    await expect(page.getByText(MOCK_CATEGORY_PRODUCT.name)).toBeVisible();
    await expect(page.getByText("$199.00")).toBeVisible();

    await page.getByRole("button", { name: "More Details" }).click();

    await expect(page).toHaveURL(
      new RegExp(`/product/${MOCK_CATEGORY_PRODUCT.slug}$`),
    );
    await expect(
      page.getByRole("heading", { name: "Product Details" }),
    ).toBeVisible();
    await expect(
      page.getByText(`Name : ${MOCK_CATEGORY_PRODUCT.name}`),
    ).toBeVisible();
    await expect(
      page.getByText(`Category : ${MOCK_CATEGORIES[0].name}`),
    ).toBeVisible();
    await expect(page.getByText(MOCK_RELATED_PRODUCT.name)).toBeVisible();
  });

  // Zyon Aaronel Wee Zhun Wei, A0277598B
  test("shows an empty result state when a category has no products", async ({
    page,
  }) => {
    await page.route("**/api/v1/product/product-category/accessories", async (route) => {
      await route.fulfill(
        json({
          success: true,
          category: MOCK_CATEGORIES[1],
          products: [],
        }),
      );
    });

    await page.goto("/categories");
    await page.getByRole("link", { name: MOCK_CATEGORIES[1].name }).click();

    await expect(page).toHaveURL(/\/category\/accessories$/);
    await expect(
      page.getByRole("heading", { name: `Category - ${MOCK_CATEGORIES[1].name}` }),
    ).toBeVisible();
    await expect(page.getByText("0 result found")).toBeVisible();
    await expect(page.getByRole("button", { name: "More Details" })).toHaveCount(0);
  });

  // Zyon Aaronel Wee Zhun Wei, A0277598B
  test("lets an authenticated admin move from the dashboard to category management and create a category", async ({
    page,
  }) => {
    const categories = [...MOCK_CATEGORIES];

    await seedAdminSession(page);

    await page.route("**/api/v1/auth/admin-auth", async (route) => {
      await route.fulfill(json({ ok: true }));
    });

    await page.route("**/api/v1/category/get-category", async (route) => {
      await route.fulfill(json({ success: true, category: categories }));
    });

    await page.route("**/api/v1/category/create-category", async (route) => {
      const { name } = JSON.parse(route.request().postData() || "{}");
      const nextCategory = {
        _id: `cat-${categories.length + 1}`,
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
      };
      categories.push(nextCategory);

      await route.fulfill(
        json({
          success: true,
          message: `${name} is created`,
          category: nextCategory,
        }),
      );
    });

    await page.goto("/dashboard/admin");

    await expect(page.getByText("Admin Name : Admin User")).toBeVisible();
    await expect(page.getByText("Admin Email : admin@example.com")).toBeVisible();
    await expect(page.getByText("Admin Contact : 91234567")).toBeVisible();

    await page.getByRole("link", { name: "Create Category" }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/create-category$/);
    await expect(
      page.getByRole("heading", { name: "Manage Category" }),
    ).toBeVisible();

    await page.getByPlaceholder("Enter new category").fill("Wearables");
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page.getByText("Wearables is created")).toBeVisible();
    await expect(page.getByRole("cell", { name: "Wearables" })).toBeVisible();
  });

  // Zyon Aaronel Wee Zhun Wei, A0277598B
  test("shows an error when an admin submits a duplicate category name", async ({
    page,
  }) => {
    const categories = [...MOCK_CATEGORIES];

    await seedAdminSession(page);

    await page.route("**/api/v1/auth/admin-auth", async (route) => {
      await route.fulfill(json({ ok: true }));
    });

    await page.route("**/api/v1/category/get-category", async (route) => {
      await route.fulfill(json({ success: true, category: categories }));
    });

    await page.route("**/api/v1/category/create-category", async (route) => {
      const { name } = JSON.parse(route.request().postData() || "{}");

      await route.fulfill(
        json({
          success: false,
          message:
            categories.some((category) => category.name === name)
              ? "Category Already Exists"
              : `${name} is created`,
        }),
      );
    });

    await page.goto("/dashboard/admin/create-category");
    await expect(
      page.getByRole("heading", { name: "Manage Category" }),
    ).toBeVisible();

    await page.getByPlaceholder("Enter new category").fill(MOCK_CATEGORIES[0].name);
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page.getByText("Category Already Exists")).toBeVisible();
    await expect(
      page.getByRole("cell", { name: MOCK_CATEGORIES[0].name }),
    ).toBeVisible();
  });

  // Zyon Aaronel Wee Zhun Wei, A0277598B
  test("prevents admin category creation when the input is empty", async ({
    page,
  }) => {
    await seedAdminSession(page);

    await page.route("**/api/v1/auth/admin-auth", async (route) => {
      await route.fulfill(json({ ok: true }));
    });

    await page.goto("/dashboard/admin/create-category");
    await expect(
      page.getByRole("heading", { name: "Manage Category" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page.getByText("Category name is required")).toBeVisible();
  });

  // Zyon Aaronel Wee Zhun Wei, A0277598B
  test("redirects unauthenticated admin access attempts to the login page", async ({
    page,
  }) => {
    await page.goto("/dashboard/admin");

    await expect(
      page.getByText(/redirecting to you in/i),
    ).toBeVisible();
    await page.waitForURL(/\/login$/, { timeout: 7000 });
    await expect(page.getByRole("button", { name: "LOGIN" })).toBeVisible();
  });
});
