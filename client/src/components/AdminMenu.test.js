import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminMenu from "./AdminMenu";

describe("AdminMenu", () => {
  // ZYON AARONEL WEE ZHUN WEI, A0277598B
  it("renders the admin navigation links", () => {
    // Arrange
    render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );

    // Act
    const createCategory = screen.getByRole("link", { name: /create category/i });
    const createProduct = screen.getByRole("link", { name: /create product/i });
    const products = screen.getByRole("link", { name: /products/i });
    const orders = screen.getByRole("link", { name: /orders/i });

    // Assert
    expect(createCategory).toHaveAttribute(
      "href",
      "/dashboard/admin/create-category"
    );
    expect(createProduct).toHaveAttribute(
      "href",
      "/dashboard/admin/create-product"
    );
    expect(products).toHaveAttribute("href", "/dashboard/admin/products");
    expect(orders).toHaveAttribute("href", "/dashboard/admin/orders");
  });
});
