import { jest } from "@jest/globals";
import {
  categoryControlller,
  singleCategoryController,
} from "./categoryController.js";
import categoryModel from "../models/categoryModel.js";

jest.mock("../models/categoryModel.js");

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe("categoryController", () => {
  let logSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  // ZYON AARONEL WEE ZHUN WEI, A0277598B
  it("returns all categories with success payload", async () => {
    // Arrange
    const req = {};
    const res = createRes();
    const categories = [{ _id: "1", name: "Phones" }];
    categoryModel.find.mockResolvedValue(categories);

    // Act
    await categoryControlller(req, res);

    // Assert
    expect(categoryModel.find).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "All Categories List",
      category: categories,
    });
  });

  // ZYON AARONEL WEE ZHUN WEI, A0277598B
  it("returns 500 when fetching categories fails", async () => {
    // Arrange
    const req = {};
    const res = createRes();
    const error = new Error("db failed");
    categoryModel.find.mockRejectedValue(error);

    // Act
    await categoryControlller(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error,
      message: "Error while getting all categories",
    });
  });

  // ZYON AARONEL WEE ZHUN WEI, A0277598B
  it("returns a single category by slug", async () => {
    // Arrange
    const req = { params: { slug: "phones" } };
    const res = createRes();
    const category = { _id: "1", name: "Phones", slug: "phones" };
    categoryModel.findOne.mockResolvedValue(category);

    // Act
    await singleCategoryController(req, res);

    // Assert
    expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "phones" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Get SIngle Category SUccessfully",
      category,
    });
  });

  // ZYON AARONEL WEE ZHUN WEI, A0277598B
  it("returns 500 when fetching a single category fails", async () => {
    // Arrange
    const req = { params: { slug: "phones" } };
    const res = createRes();
    const error = new Error("db error");
    categoryModel.findOne.mockRejectedValue(error);

    // Act
    await singleCategoryController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error,
      message: "Error While getting Single Category",
    });
  });
});
