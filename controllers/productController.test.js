import {
  createProductController,
  updateProductController,
  deleteProductController,
  getProductController,
  getSingleProductController,
  productPhotoController,
  productFiltersController,
  productCountController,
  productListController,
  searchProductController,
  realtedProductController,
  productCategoryController,
} from "./productController.js";
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import fs from "fs";
import slugify from "slugify";

// ─── Module Mocks ────────────────────────────────────────────────────────────

jest.mock("../models/productModel.js", () => {
  const MockProductModel = jest.fn().mockImplementation(() => ({
    photo: { data: null, contentType: null },
    save: jest.fn().mockResolvedValue({}),
  }));
  MockProductModel.find = jest.fn();
  MockProductModel.findById = jest.fn();
  MockProductModel.findOne = jest.fn();
  MockProductModel.findByIdAndUpdate = jest.fn();
  MockProductModel.findByIdAndDelete = jest.fn();
  return { __esModule: true, default: MockProductModel };
});

jest.mock("../models/categoryModel.js", () => {
  const MockCategoryModel = jest.fn();
  MockCategoryModel.findOne = jest.fn();
  return { __esModule: true, default: MockCategoryModel };
});

jest.mock("../models/orderModel.js", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue({}),
  })),
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
  set: jest.fn(),
  json: jest.fn(),
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

// ─────────────────────────────────────────────────────────────────────────────
// getProductController
// ─────────────────────────────────────────────────────────────────────────────

describe("getProductController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {};
    res = buildRes();
  });

  it("given products exist – should return 200 with all products", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    const mockProducts = [{ _id: "p1", name: "iPhone" }, { _id: "p2", name: "MacBook" }];
    productModel.find.mockReturnValueOnce({
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(mockProducts),
    });

    // When
    await getProductController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, products: mockProducts })
    );
  });

  it("given no products – should return 200 with an empty array", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    productModel.find.mockReturnValueOnce({
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([]),
    });

    // When
    await getProductController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, products: [] })
    );
  });

  it("given a database error – should return 500 with error details", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    productModel.find.mockReturnValueOnce({
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockRejectedValue(new Error("DB Error")),
    });

    // When
    await getProductController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Erorr in getting products" })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getSingleProductController
// ─────────────────────────────────────────────────────────────────────────────

describe("getSingleProductController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: { slug: "iphone-15" } };
    res = buildRes();
  });

  it("given a valid slug – should return 200 with the matching product", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    const mockProduct = { _id: "p1", name: "iPhone 15", slug: "iphone-15" };
    productModel.findOne.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(mockProduct),
    });

    // When
    await getSingleProductController(req, res);

    // Then
    expect(productModel.findOne).toHaveBeenCalledWith({ slug: "iphone-15" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, product: mockProduct })
    );
  });

  it("given a database error – should return 500 with error details", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    productModel.findOne.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockRejectedValue(new Error("DB Error")),
    });

    // When
    await getSingleProductController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Eror while getitng single product" })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// productPhotoController
// ─────────────────────────────────────────────────────────────────────────────

describe("productPhotoController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: { pid: "prod1" } };
    res = buildRes();
  });

  it("given a product with photo – should set Content-type and return 200 with data", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    const photoData = Buffer.from("image-bytes");
    productModel.findById.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({
        photo: { data: photoData, contentType: "image/jpeg" },
      }),
    });

    // When
    await productPhotoController(req, res);

    // Then
    expect(productModel.findById).toHaveBeenCalledWith("prod1");
    expect(res.set).toHaveBeenCalledWith("Content-type", "image/jpeg");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(photoData);
  });

  it("given a database error – should return 500 with error details", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    productModel.findById.mockReturnValueOnce({
      select: jest.fn().mockRejectedValue(new Error("DB Error")),
    });

    // When
    await productPhotoController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Erorr while getting photo" })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// productFiltersController
// ─────────────────────────────────────────────────────────────────────────────

describe("productFiltersController", () => {
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = buildRes();
  });

  it("given category filters – should query by category and return 200", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    const req = { body: { checked: ["cat1", "cat2"], radio: [] } };
    const mockProducts = [{ _id: "p1" }];
    productModel.find.mockResolvedValueOnce(mockProducts);

    // When
    await productFiltersController(req, res);

    // Then
    expect(productModel.find).toHaveBeenCalledWith({ category: ["cat1", "cat2"] });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, products: mockProducts })
    );
  });

  it("given price range filter – should query with price bounds and return 200", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    const req = { body: { checked: [], radio: [10, 100] } };
    productModel.find.mockResolvedValueOnce([{ _id: "p2" }]);

    // When
    await productFiltersController(req, res);

    // Then
    expect(productModel.find).toHaveBeenCalledWith({
      price: { $gte: 10, $lte: 100 },
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("given no filters – should query with empty args and return 200", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    const req = { body: { checked: [], radio: [] } };
    productModel.find.mockResolvedValueOnce([]);

    // When
    await productFiltersController(req, res);

    // Then
    expect(productModel.find).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("given a database error – should return 400 with error details", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    const req = { body: { checked: [], radio: [] } };
    productModel.find.mockRejectedValueOnce(new Error("DB Error"));

    // When
    await productFiltersController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Error WHile Filtering Products" })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// productCountController
// ─────────────────────────────────────────────────────────────────────────────

describe("productCountController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {};
    res = buildRes();
  });

  it("given products exist – should return 200 with the total count", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    productModel.find.mockReturnValueOnce({
      estimatedDocumentCount: jest.fn().mockResolvedValue(42),
    });

    // When
    await productCountController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, total: 42 })
    );
  });

  it("given a database error – should return 400 with error details", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    productModel.find.mockReturnValueOnce({
      estimatedDocumentCount: jest.fn().mockRejectedValue(new Error("DB Error")),
    });

    // When
    await productCountController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Error in product count" })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// productListController
// ─────────────────────────────────────────────────────────────────────────────

describe("productListController", () => {
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = buildRes();
  });

  const makeListChain = (resolvedValue) => {
    const mockSort = jest.fn().mockResolvedValue(resolvedValue);
    const mockLimit = jest.fn().mockReturnValue({ sort: mockSort });
    const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
    const mockSelect = jest.fn().mockReturnValue({ skip: mockSkip });
    return { chain: { select: mockSelect }, mockSkip };
  };

  it("given page 1 – should skip 0 records and return 200", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    const req = { params: { page: 1 } };
    const mockProducts = [{ _id: "p1" }];
    const { chain, mockSkip } = makeListChain(mockProducts);
    productModel.find.mockReturnValueOnce(chain);

    // When
    await productListController(req, res);

    // Then
    expect(mockSkip).toHaveBeenCalledWith(0);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, products: mockProducts })
    );
  });

  it("given page 2 – should skip 6 records and return 200", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    const req = { params: { page: 2 } };
    const { chain, mockSkip } = makeListChain([{ _id: "p7" }]);
    productModel.find.mockReturnValueOnce(chain);

    // When
    await productListController(req, res);

    // Then
    expect(mockSkip).toHaveBeenCalledWith(6);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("given a database error – should return 400 with error details", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    const req = { params: { page: 1 } };
    const mockSort = jest.fn().mockRejectedValue(new Error("DB Error"));
    const mockLimit = jest.fn().mockReturnValue({ sort: mockSort });
    const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
    productModel.find.mockReturnValueOnce({ select: jest.fn().mockReturnValue({ skip: mockSkip }) });

    // When
    await productListController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "error in per page ctrl" })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// searchProductController
// ─────────────────────────────────────────────────────────────────────────────

describe("searchProductController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: { keyword: "iphone" } };
    res = buildRes();
  });

  it("given a keyword – should search name and description then return results via json", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    const mockResults = [{ _id: "p1", name: "iPhone 15" }];
    productModel.find.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue(mockResults),
    });

    // When
    await searchProductController(req, res);

    // Then
    expect(productModel.find).toHaveBeenCalledWith(
      expect.objectContaining({ $or: expect.any(Array) })
    );
    expect(res.json).toHaveBeenCalledWith(mockResults);
  });

  it("given a database error – should return 400 with error details", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    productModel.find.mockReturnValueOnce({
      select: jest.fn().mockRejectedValue(new Error("DB Error")),
    });

    // When
    await searchProductController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Error In Search Product API" })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// realtedProductController
// ─────────────────────────────────────────────────────────────────────────────

describe("realtedProductController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: { pid: "prod1", cid: "cat1" } };
    res = buildRes();
  });

  it("given valid pid and cid – should return 200 with related products", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    const mockProducts = [{ _id: "p2", name: "Samsung Galaxy" }];
    productModel.find.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(mockProducts),
    });

    // When
    await realtedProductController(req, res);

    // Then
    expect(productModel.find).toHaveBeenCalledWith({
      category: "cat1",
      _id: { $ne: "prod1" },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, products: mockProducts })
    );
  });

  it("given a database error – should return 400 with error details", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    productModel.find.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockRejectedValue(new Error("DB Error")),
    });

    // When
    await realtedProductController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "error while geting related product" })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// productCategoryController
// ─────────────────────────────────────────────────────────────────────────────

describe("productCategoryController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { params: { slug: "electronics" } };
    res = buildRes();
  });

  it("given a valid slug – should return 200 with category and its products", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    const mockCategory = { _id: "cat1", name: "Electronics", slug: "electronics" };
    const mockProducts = [{ _id: "p1", name: "iPhone" }];
    categoryModel.findOne.mockResolvedValueOnce(mockCategory);
    productModel.find.mockReturnValueOnce({
      populate: jest.fn().mockResolvedValue(mockProducts),
    });

    // When
    await productCategoryController(req, res);

    // Then
    expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "electronics" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        category: mockCategory,
        products: mockProducts,
      })
    );
  });

  it("given a database error – should return 400 with error details", async () => {
    //Julius Bryan Reynon Gambe, A0252251R
    // Given
    categoryModel.findOne.mockRejectedValueOnce(new Error("DB Error"));

    // When
    await productCategoryController(req, res);

    // Then
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Error While Getting products" })
    );
  });
});
