import http from "k6/http";
import { check, sleep } from "k6";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  BASE_URL,
  DEFAULT_THRESHOLDS,
  createAdminCategory,
  createAdminProduct,
  getCatalogFixture,
  jsonParams,
  login,
  multipartParams,
  requireAdminCredentials,
  sleepRange,
  uniqueSuffix,
} from "./_shared.js";

/*
Load Test 7: Admin Catalog Management
Objective: Measure create/update/delete catalog operations using the actual
admin routes present in the codebase.
*/

// Huang Yi Chee, A0259617R

export const options = {
  scenarios: {
    createCategory: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 3 },
        { duration: "5m", target: 3 },
        { duration: "30s", target: 0 },
      ],
      exec: "createCategoryFlow",
    },
    updateProduct: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 5 },
        { duration: "5m", target: 5 },
        { duration: "30s", target: 0 },
      ],
      exec: "updateProductFlow",
    },
    deleteProduct: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 2 },
        { duration: "5m", target: 2 },
        { duration: "30s", target: 0 },
      ],
      exec: "deleteProductFlow",
    },
  },
  thresholds: DEFAULT_THRESHOLDS,
  summaryTrendStats: ["avg", "med", "p(90)", "p(95)", "p(99)", "max"],
};

export function setup() {
  requireAdminCredentials();
  const auth = login(ADMIN_EMAIL, ADMIN_PASSWORD, "admin_catalog_login_setup");
  const fixture = getCatalogFixture();
  const category = createAdminCategory(auth.token);
  const product = createAdminProduct(auth.token, category._id);

  return {
    token: auth.token,
    seedCategoryId: category._id,
    managedProductId: product._id,
    managedProductName: product.name,
    fallbackCategoryId: fixture.categories[0]?._id || category._id,
  };
}

export function createCategoryFlow(data) {
  const name = `k6-admin-category-${uniqueSuffix()}`;
  const createRes = http.post(
    `${BASE_URL}/api/v1/category/create-category`,
    JSON.stringify({ name }),
    jsonParams(data.token, { name: "admin_create_category", flow: "admin-write" }),
  );
  check(createRes, {
    "admin category create ok": (res) => res.status === 201,
  });

  sleep(sleepRange(1, 2.5));
}

export function updateProductFlow(data) {
  const updateBody = {
    name: `${data.managedProductName}-${uniqueSuffix()}`.slice(0, 80),
    description: `Updated by k6 ${uniqueSuffix()}`,
    price: "18.99",
    quantity: "30",
    category: data.seedCategoryId || data.fallbackCategoryId,
    shipping: "1",
    photo: http.file("k6 update payload", `k6-update-${uniqueSuffix()}.png`, "image/png"),
  };

  const updateRes = http.put(
    `${BASE_URL}/api/v1/product/update-product/${data.managedProductId}`,
    updateBody,
    multipartParams(data.token, { name: "admin_update_product", flow: "admin-write" }),
  );
  check(updateRes, {
    "admin product update ok": (res) => res.status === 201,
  });

  sleep(sleepRange(1, 2.5));
}

export function deleteProductFlow(data) {
  const transientProduct = createAdminProduct(data.token, data.seedCategoryId);
  const deleteRes = http.del(
    `${BASE_URL}/api/v1/product/delete-product/${transientProduct._id}`,
    null,
    {
      headers: { Authorization: data.token },
      tags: { name: "admin_delete_product", flow: "admin-write" },
    },
  );
  check(deleteRes, {
    "admin product delete ok": (res) => res.status === 200,
  });

  sleep(sleepRange(1, 2.5));
}
