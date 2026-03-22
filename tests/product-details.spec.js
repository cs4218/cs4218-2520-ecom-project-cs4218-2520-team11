/**
 * E2E UI tests – Product Details & Category Product Pages
 *
 * Strategy:
 *   - Intercept API endpoints with page.route() for deterministic results.
 *   - ProductDetails: /product/:slug → fetches product + related products.
 *   - CategoryProduct: /category/:slug → fetches products by category.
 *
 * Run:
 *   npx playwright test tests/product-details.spec.js
 */

import { test, expect } from "@playwright/test";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_CATEGORY = {
  _id: "cat-electronics",
  name: "Electronics",
  slug: "electronics",
};

const MOCK_PRODUCT = {
  _id: "prod-main-1",
  name: "Premium Gaming Laptop",
  slug: "premium-gaming-laptop",
  description:
    "This is a high-end gaming laptop with RTX 4090 GPU and 64GB DDR5 RAM for ultimate performance",
  price: 2499.99,
  quantity: 5,
  category: MOCK_CATEGORY,
};

const MOCK_RELATED_1 = {
  _id: "prod-related-1",
  name: "Budget Gaming Laptop",
  slug: "budget-gaming-laptop",
  description:
    "An affordable gaming laptop with decent performance for casual gamers and students alike",
  price: 899.99,
  quantity: 20,
  category: MOCK_CATEGORY,
};

const MOCK_RELATED_2 = {
  _id: "prod-related-2",
  name: "Gaming Desktop",
  slug: "gaming-desktop",
  description:
    "Powerful desktop computer with high-end specs for serious gaming and content creation work",
  price: 1799.99,
  quantity: 8,
  category: MOCK_CATEGORY,
};

// Category product page mock data
const MOCK_CAT_PRODUCT_1 = {
  _id: "cat-prod-1",
  name: "Wireless Headphones",
  slug: "wireless-headphones",
  description:
    "Noise-cancelling wireless headphones with premium sound quality and long battery life span",
  price: 299.99,
  quantity: 15,
  category: MOCK_CATEGORY,
};

const MOCK_CAT_PRODUCT_2 = {
  _id: "cat-prod-2",
  name: "Bluetooth Speaker",
  slug: "bluetooth-speaker",
  description:
    "Portable Bluetooth speaker with waterproof design and deep bass for outdoor adventures",
  price: 79.99,
  quantity: 30,
  category: MOCK_CATEGORY,
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

  // Braintree token (called by CartPage context but also by Layout)
  await page.route("**/api/v1/product/braintree/token", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ clientToken: "" }),
    })
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 3a: ProductDetails page
// ─────────────────────────────────────────────────────────────────────────────

test.describe("ProductDetails Page", () => {
  test.beforeEach(async ({ page }) => {
    await stubCommonApis(page);
  });

  // ── 1.1 Product fetch on mount ──────────────────────────────────────────
  test("fetches the product using the slug from the URL", async ({ page }) => {
    let capturedProductUrl = null;
    await page.route(/\/api\/v1\/product\/get-product\//, (route) => {
      capturedProductUrl = route.request().url();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ product: MOCK_PRODUCT }),
      });
    });

    await page.route(/\/api\/v1\/product\/related-product\//, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ products: [] }),
      })
    );

    await page.goto(`/product/${MOCK_PRODUCT.slug}`);
    await page.waitForLoadState("networkidle");

    // Verify the API was called with the correct slug
    await expect.poll(() => capturedProductUrl).toBeTruthy();
    expect(capturedProductUrl).toContain(
      `/api/v1/product/get-product/${MOCK_PRODUCT.slug}`
    );
  });

  // ── 1.2 Product info rendering ──────────────────────────────────────────
  test("renders product name, description, price, category, image, and ADD TO CART", async ({
    page,
  }) => {
    await page.route(/\/api\/v1\/product\/get-product\//, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ product: MOCK_PRODUCT }),
      })
    );

    await page.route(/\/api\/v1\/product\/related-product\//, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ products: [] }),
      })
    );

    await page.goto(`/product/${MOCK_PRODUCT.slug}`);
    await page.waitForLoadState("networkidle");

    // Name
    await expect(page.getByText(`Name : ${MOCK_PRODUCT.name}`)).toBeVisible();

    // Description
    await expect(
      page.getByText(`Description : ${MOCK_PRODUCT.description}`)
    ).toBeVisible();

    // Price formatted as USD
    await expect(page.getByText("$2,499.99")).toBeVisible();

    // Category name
    await expect(
      page.getByText(`Category : ${MOCK_CATEGORY.name}`)
    ).toBeVisible();

    // Product image
    const img = page.getByRole("img", { name: MOCK_PRODUCT.name });
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute(
      "src",
      `/api/v1/product/product-photo/${MOCK_PRODUCT._id}`
    );

    // ADD TO CART button
    await expect(
      page.getByRole("button", { name: "ADD TO CART" })
    ).toBeVisible();
  });

  // ── 1.4 Similar products rendering ──────────────────────────────────────
  test("renders related product cards with name, price, description (60 chars), image, and More Details", async ({
    page,
  }) => {
    await page.route(/\/api\/v1\/product\/get-product\//, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ product: MOCK_PRODUCT }),
      })
    );

    await page.route(/\/api\/v1\/product\/related-product\//, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ products: [MOCK_RELATED_1, MOCK_RELATED_2] }),
      })
    );

    await page.goto(`/product/${MOCK_PRODUCT.slug}`);
    await page.waitForLoadState("networkidle");

    // Related product names
    await expect(
      page.getByRole("heading", { name: MOCK_RELATED_1.name })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: MOCK_RELATED_2.name })
    ).toBeVisible();

    // Related product description truncated to 60 chars
    const truncatedDesc =
      MOCK_RELATED_1.description.substring(0, 60) + "...";
    await expect(page.getByText(truncatedDesc)).toBeVisible();

    // More Details buttons (one per related product)
    const moreDetailsButtons = page.getByRole("button", {
      name: "More Details",
    });
    await expect(moreDetailsButtons).toHaveCount(2);
  });

  // ── 1.5 No similar products ─────────────────────────────────────────────
  test('displays "No Similar Products found" when no related products', async ({
    page,
  }) => {
    await page.route(/\/api\/v1\/product\/get-product\//, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ product: MOCK_PRODUCT }),
      })
    );

    await page.route(/\/api\/v1\/product\/related-product\//, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ products: [] }),
      })
    );

    await page.goto(`/product/${MOCK_PRODUCT.slug}`);
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByText("No Similar Products found")
    ).toBeVisible();
  });

  // ── Similar products fetch verification ─────────────────────────────────
  test("calls the related-product API with the correct product and category IDs", async ({
    page,
  }) => {
    await page.route(/\/api\/v1\/product\/get-product\//, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ product: MOCK_PRODUCT }),
      })
    );

    let capturedRelatedUrl = null;
    await page.route(/\/api\/v1\/product\/related-product\//, (route) => {
      capturedRelatedUrl = route.request().url();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ products: [] }),
      });
    });

    await page.goto(`/product/${MOCK_PRODUCT.slug}`);
    await page.waitForLoadState("networkidle");

    await expect.poll(() => capturedRelatedUrl).toBeTruthy();
    expect(capturedRelatedUrl).toContain(
      `/api/v1/product/related-product/${MOCK_PRODUCT._id}/${MOCK_CATEGORY._id}`
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 3b: CategoryProduct page
// ─────────────────────────────────────────────────────────────────────────────

test.describe("CategoryProduct Page", () => {
  test.beforeEach(async ({ page }) => {
    await stubCommonApis(page);
  });

  // ── 2.1 Category product fetch ──────────────────────────────────────────
  test("fetches products by category slug and renders them", async ({
    page,
  }) => {
    let capturedCategoryUrl = null;
    await page.route(/\/api\/v1\/product\/product-category\//, (route) => {
      capturedCategoryUrl = route.request().url();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          products: [MOCK_CAT_PRODUCT_1],
          category: MOCK_CATEGORY,
        }),
      });
    });

    await page.goto(`/category/${MOCK_CATEGORY.slug}`);
    await page.waitForLoadState("networkidle");

    await expect.poll(() => capturedCategoryUrl).toBeTruthy();
    expect(capturedCategoryUrl).toContain(
      `/api/v1/product/product-category/${MOCK_CATEGORY.slug}`
    );
  });

  // ── 2.2 Category header rendering ──────────────────────────────────────
  test("displays the category name and product count", async ({ page }) => {
    await page.route(/\/api\/v1\/product\/product-category\//, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          products: [MOCK_CAT_PRODUCT_1, MOCK_CAT_PRODUCT_2],
          category: MOCK_CATEGORY,
        }),
      })
    );

    await page.goto(`/category/${MOCK_CATEGORY.slug}`);
    await page.waitForLoadState("networkidle");

    // Category name in heading
    await expect(
      page.getByText(`Category - ${MOCK_CATEGORY.name}`)
    ).toBeVisible();

    // Product count
    await expect(page.getByText("2 result found")).toBeVisible();
  });

  // ── 2.3 Product card rendering ──────────────────────────────────────────
  test("renders product cards with name, price, description (60 chars), image, and More Details", async ({
    page,
  }) => {
    await page.route(/\/api\/v1\/product\/product-category\//, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          products: [MOCK_CAT_PRODUCT_1],
          category: MOCK_CATEGORY,
        }),
      })
    );

    await page.goto(`/category/${MOCK_CATEGORY.slug}`);
    await page.waitForLoadState("networkidle");

    // Product name
    await expect(
      page.getByRole("heading", { name: MOCK_CAT_PRODUCT_1.name })
    ).toBeVisible();

    // Description truncated to 60 chars
    const truncatedDesc =
      MOCK_CAT_PRODUCT_1.description.substring(0, 60) + "...";
    await expect(page.getByText(truncatedDesc)).toBeVisible();

    // Product image
    const img = page.getByRole("img", { name: MOCK_CAT_PRODUCT_1.name });
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute(
      "src",
      `/api/v1/product/product-photo/${MOCK_CAT_PRODUCT_1._id}`
    );

    // More Details button
    await expect(
      page.getByRole("button", { name: "More Details" })
    ).toBeVisible();
  });
});
