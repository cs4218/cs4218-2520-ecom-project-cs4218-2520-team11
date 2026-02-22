import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Categories from "./Categories";

jest.mock("../hooks/useCategory", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../components/Layout", () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

import useCategory from "../hooks/useCategory";

describe("Categories page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ZYON AARONEL WEE ZHUN WEI, A0277598B
  it("renders a link for each category", () => {
    // Arrange
    useCategory.mockReturnValue([
      { _id: "1", name: "Phones", slug: "phones" },
      { _id: "2", name: "Laptops", slug: "laptops" },
    ]);

    // Act
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    // Assert
    expect(screen.getByRole("link", { name: "Phones" })).toHaveAttribute(
      "href",
      "/category/phones"
    );
    expect(screen.getByRole("link", { name: "Laptops" })).toHaveAttribute(
      "href",
      "/category/laptops"
    );
  });
});
