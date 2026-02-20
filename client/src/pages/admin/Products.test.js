import React from "react";
import { render, waitFor, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import toast from "react-hot-toast";
import { MemoryRouter } from "react-router-dom";
import Products from "./Products";

// ─── Module Mocks ────────────────────────────────────────────────────────────

jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">AdminMenu</div>
));

// ─── Test Helpers ────────────────────────────────────────────────────────────

window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

const mockProducts = [
  {
    _id: "prod1",
    name: "iPhone 15",
    description: "Latest iPhone model",
    slug: "iphone-15",
  },
  {
    _id: "prod2",
    name: "MacBook Pro",
    description: "Powerful laptop for professionals",
    slug: "macbook-pro",
  },
];

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("Products", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe("Rendering", () => {
    it("should render the All Products List heading", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: [] } });

      // Act
      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );

      // Assert
      expect(screen.getByText("All Products List")).toBeInTheDocument();
    });

    it("should render the AdminMenu component", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: [] } });

      // Act
      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );

      // Assert
      expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
    });
  });

  // ── Fetching Products ──────────────────────────────────────────────────────

  describe("Fetching Products", () => {
    it("should call GET /api/v1/product/get-product on mount", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: [] } });

      // Act
      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );

      // Assert
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product");
      });
    });

    it("should display fetched products as cards with name and description", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

      // Act
      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByText("iPhone 15")).toBeInTheDocument();
        expect(screen.getByText("MacBook Pro")).toBeInTheDocument();
        expect(screen.getByText("Latest iPhone model")).toBeInTheDocument();
        expect(
          screen.getByText("Powerful laptop for professionals")
        ).toBeInTheDocument();
      });
    });

    it("should render product links pointing to the admin update page", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

      // Act
      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );

      // Assert
      await waitFor(() => {
        const links = screen.getAllByRole("link");
        expect(links[0]).toHaveAttribute(
          "href",
          "/dashboard/admin/product/iphone-15"
        );
        expect(links[1]).toHaveAttribute(
          "href",
          "/dashboard/admin/product/macbook-pro"
        );
      });
    });

    it("should render product images with correct API source URLs", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

      // Act
      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );

      // Assert
      await waitFor(() => {
        const images = screen.getAllByRole("img");
        expect(images[0]).toHaveAttribute(
          "src",
          "/api/v1/product/product-photo/prod1"
        );
        expect(images[1]).toHaveAttribute(
          "src",
          "/api/v1/product/product-photo/prod2"
        );
      });
    });

    it("should render an empty list when no products are returned", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: [] } });

      // Act
      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );

      // Assert
      await waitFor(() => {
        expect(screen.queryByRole("link")).not.toBeInTheDocument();
        expect(screen.queryByRole("img")).not.toBeInTheDocument();
      });
    });

    it("should show error toast when fetching products fails", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      axios.get.mockRejectedValueOnce(new Error("Network error"));

      // Act
      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Someething Went Wrong");
      });
    });
  });
});
