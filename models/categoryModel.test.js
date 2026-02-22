import { jest } from "@jest/globals";
import Category from "./categoryModel.js";

describe("categoryModel", () => {
  // ZYON AARONEL WEE ZHUN WEI, A0277598B
  it("lowercases the slug value", () => {
    // Arrange
    const category = new Category({ name: "Phones", slug: "MiXeD" });

    // Act
    const result = category.slug;

    // Assert
    expect(result).toBe("mixed");
  });

  // ZYON AARONEL WEE ZHUN WEI, A0277598B
  it("validates successfully with a name and slug", () => {
    // Arrange
    const category = new Category({ name: "Accessories", slug: "accessories" });

    // Act
    const error = category.validateSync();

    // Assert
    expect(error).toBeUndefined();
  });
});
