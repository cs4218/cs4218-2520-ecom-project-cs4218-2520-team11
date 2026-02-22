import {
  createProductController,
  updateProductController,
  deleteProductController,
} from "./productController.js";
import productModel from "../models/productModel.js";
import fs from "fs";
import slugify from "slugify";

// ─── Module Mocks ────────────────────────────────────────────────────────────

jest.mock("../models/productModel.js", () => {
  const MockProductModel = jest.fn().mockImplementation(() => ({
    photo: { data: null, contentType: null },
    save: jest.fn().mockResolvedValue({}),
  }));
  MockProductModel.findByIdAndUpdate = jest.fn();
  MockProductModel.findByIdAndDelete = jest.fn();
  return { __esModule: true, default: MockProductModel };
});

jest.mock("../models/categoryModel.js", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("fs", () => ({
  readFileSync: jest.fn(() => Buffer.from("mock-image-data")),
}));

jest.mock("slugify", () => ({
  __esModule: true,
  default: jest.fn((str) => str.toLowerCase().replace(/\s+/g, "-")),
}));

// Prevent module-level BraintreeGateway constructor from failing
jest.mock("braintree", () => ({
  BraintreeGateway: jest.fn().mockImplementation(() => ({})),
  Environment: { Sandbox: "sandbox" },
}));

jest.mock("dotenv", () => ({ config: jest.fn() }));

// ─── Shared Test Helpers ──────────────────────────────────────────────────────

const buildRes = () => ({
  status: jest.fn().mockReturnThis(),
  send: jest.fn(),
});

/** Default valid fields for create/update tests */
const validFields = {
  name: "Test Product",
  description: "A detailed description",
  price: "99.99",
  category: "cat1",
  quantity: "10",
  shipping: "1",
};

/** Default photo fixture (< 1 MB) */
const validPhoto = {
  path: "/tmp/photo.jpg",
  type: "image/jpeg",
  size: 500_000,
};

// ─────────────────────────────────────────────────────────────────────────────
// createProductController
// ─────────────────────────────────────────────────────────────────────────────

describe("createProductController", () => {
  let req, res, mockProductInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    slugify.mockReturnValue("test-product");
    fs.readFileSync.mockReturnValue(Buffer.from("mock-image-data"));

    mockProductInstance = {
      photo: { data: null, contentType: null },
      save: jest.fn().mockResolvedValue({}),
    };
    productModel.mockImplementation(() => mockProductInstance);

    req = {
      fields: { ...validFields },
      files: { photo: { ...validPhoto } },
    };
    res = buildRes();
  });

  // ── Validation – missing required fields ───────────────────────────────────

  it("given missing name – should return 500 with Name is Required", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    req.fields.name = undefined;

    // When
    await createProductController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
  });

  it("given missing description – should return 500 with Description is Required", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    req.fields.description = undefined;

    // When
    await createProductController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "Description is Required",
    });
  });

  it("given missing price – should return 500 with Price is Required", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    req.fields.price = undefined;

    // When
    await createProductController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Price is Required" });
  });

  it("given missing category – should return 500 with Category is Required", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    req.fields.category = undefined;

    // When
    await createProductController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Category is Required" });
  });

  it("given missing quantity – should return 500 with Quantity is Required", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    req.fields.quantity = undefined;

    // When
    await createProductController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Quantity is Required" });
  });

  it("given photo larger than 1 MB – should return 500 with photo size error", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    req.files.photo.size = 1_500_000; // 1.5 MB

    // When
    await createProductController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "photo is Required and should be less then 1mb",
    });
  });

  // ── Successful Creation ────────────────────────────────────────────────────

  it("given all valid fields with photo – should read photo, save product, and return 201", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given – req already set to valid state in beforeEach

    // When
    await createProductController(req, res);

    // Then
    expect(fs.readFileSync).toHaveBeenCalledWith("/tmp/photo.jpg");
    expect(mockProductInstance.photo.data).toEqual(
      Buffer.from("mock-image-data")
    );
    expect(mockProductInstance.photo.contentType).toBe("image/jpeg");
    expect(mockProductInstance.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Product Created Successfully",
      })
    );
  });

  it("given valid fields without a photo – should save product without reading fs and return 201", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    req.files = {};

    // When
    await createProductController(req, res);

    // Then
    expect(fs.readFileSync).not.toHaveBeenCalled();
    expect(mockProductInstance.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Product Created Successfully",
      })
    );
  });

  it("given valid data – should call slugify with the product name", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given – valid req set in beforeEach

    // When
    await createProductController(req, res);

    // Then
    expect(slugify).toHaveBeenCalledWith("Test Product");
  });

  it("given a photo exactly at 1 MB – should pass validation and create product", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given – exactly 1 MB is allowed (condition is size > 1000000)
    req.files.photo.size = 1_000_000;

    // When
    await createProductController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(201);
  });

  // ── Error Handling ─────────────────────────────────────────────────────────

  it("given a database error on save – should return 500 with error details", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    mockProductInstance.save.mockRejectedValueOnce(new Error("DB Error"));

    // When
    await createProductController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error in creating product",
      })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// updateProductController
// ─────────────────────────────────────────────────────────────────────────────

describe("updateProductController", () => {
  let req, res, mockUpdatedProduct;

  beforeEach(() => {
    jest.clearAllMocks();
    slugify.mockReturnValue("updated-product");
    fs.readFileSync.mockReturnValue(Buffer.from("updated-image-data"));

    mockUpdatedProduct = {
      photo: { data: null, contentType: null },
      save: jest.fn().mockResolvedValue({}),
    };
    productModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedProduct);

    req = {
      params: { pid: "prod1" },
      fields: {
        name: "Updated Product",
        description: "Updated description",
        price: "149.99",
        category: "cat1",
        quantity: "20",
        shipping: "1",
      },
      files: {
        photo: {
          path: "/tmp/updated.jpg",
          type: "image/png",
          size: 300_000,
        },
      },
    };
    res = buildRes();
  });

  // ── Validation – missing required fields ───────────────────────────────────

  it("given missing name – should return 500 with Name is Required", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    req.fields.name = undefined;

    // When
    await updateProductController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
  });

  it("given missing description – should return 500 with Description is Required", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    req.fields.description = undefined;

    // When
    await updateProductController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "Description is Required",
    });
  });

  it("given missing price – should return 500 with Price is Required", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    req.fields.price = undefined;

    // When
    await updateProductController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Price is Required" });
  });

  it("given missing category – should return 500 with Category is Required", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    req.fields.category = undefined;

    // When
    await updateProductController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Category is Required" });
  });

  it("given missing quantity – should return 500 with Quantity is Required", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    req.fields.quantity = undefined;

    // When
    await updateProductController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Quantity is Required" });
  });

  it("given photo larger than 1 MB – should return 500 with photo size error", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    req.files.photo.size = 2_000_000; // 2 MB

    // When
    await updateProductController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "photo is Required and should be less then 1mb",
    });
  });

  // ── Successful Update ──────────────────────────────────────────────────────

  it("given valid data with photo – should update photo data, save, and return 201", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given – valid req set in beforeEach

    // When
    await updateProductController(req, res);

    // Then
    expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "prod1",
      expect.objectContaining({ slug: "updated-product" }),
      { new: true }
    );
    expect(fs.readFileSync).toHaveBeenCalledWith("/tmp/updated.jpg");
    expect(mockUpdatedProduct.photo.data).toEqual(
      Buffer.from("updated-image-data")
    );
    expect(mockUpdatedProduct.photo.contentType).toBe("image/png");
    expect(mockUpdatedProduct.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Product Updated Successfully",
      })
    );
  });

  it("given valid data without a new photo – should not read fs and return 201", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    req.files = {};

    // When
    await updateProductController(req, res);

    // Then
    expect(fs.readFileSync).not.toHaveBeenCalled();
    expect(mockUpdatedProduct.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Product Updated Successfully",
      })
    );
  });

  it("given valid data – should call slugify with the updated product name", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given – valid req set in beforeEach

    // When
    await updateProductController(req, res);

    // Then
    expect(slugify).toHaveBeenCalledWith("Updated Product");
  });

  it("given valid data – should call findByIdAndUpdate with the product id from params", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    req.params.pid = "specific-product-id";

    // When
    await updateProductController(req, res);

    // Then
    expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "specific-product-id",
      expect.any(Object),
      { new: true }
    );
  });

  // ── Error Handling ─────────────────────────────────────────────────────────

  it("given a database error on findByIdAndUpdate – should return 500 with error details", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    productModel.findByIdAndUpdate.mockRejectedValueOnce(new Error("DB Error"));

    // When
    await updateProductController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error in Update product",
      })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// deleteProductController
// ─────────────────────────────────────────────────────────────────────────────

describe("deleteProductController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: { pid: "prod1" } };
    res = buildRes();
  });

  // ── Successful Deletion ────────────────────────────────────────────────────

  it("given a valid product id – should delete product and return 200", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    productModel.findByIdAndDelete.mockReturnValueOnce({
      select: jest.fn().mockResolvedValueOnce({ _id: "prod1" }),
    });

    // When
    await deleteProductController(req, res);

    // Then
    expect(productModel.findByIdAndDelete).toHaveBeenCalledWith("prod1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product Deleted successfully",
    });
  });

  it("given a non-existent product id – should still return 200 (delete is idempotent)", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    productModel.findByIdAndDelete.mockReturnValueOnce({
      select: jest.fn().mockResolvedValueOnce(null),
    });

    // When
    await deleteProductController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product Deleted successfully",
    });
  });

  it("given a valid id – should call findByIdAndDelete with the exact pid", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    req.params.pid = "exact-prod-id-123";
    productModel.findByIdAndDelete.mockReturnValueOnce({
      select: jest.fn().mockResolvedValueOnce({}),
    });

    // When
    await deleteProductController(req, res);

    // Then
    expect(productModel.findByIdAndDelete).toHaveBeenCalledWith(
      "exact-prod-id-123"
    );
  });

  // ── Error Handling ─────────────────────────────────────────────────────────

  it("given a database error – should return 500 with error details", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    productModel.findByIdAndDelete.mockReturnValueOnce({
      select: jest.fn().mockRejectedValueOnce(new Error("DB Error")),
    });

    // When
    await deleteProductController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error while deleting product",
      })
    );
  });

  it("given findByIdAndDelete itself throws – should return 500 with error details", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    productModel.findByIdAndDelete.mockImplementationOnce(() => {
      throw new Error("Connection lost");
    });

    // When
    await deleteProductController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error while deleting product",
      })
    );
  });
});
