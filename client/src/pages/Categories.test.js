import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import Categories from "./Categories";
import { AuthProvider } from "../context/auth";
import { CartProvider } from "../context/cart";

jest.mock("axios");

jest.mock("../components/Form/SearchInput", () => ({
  __esModule: true,
  default: () => <div data-testid="search-input">Search Input</div>,
}));

jest.mock("antd", () => ({
  Badge: ({ count, children }) => (
    <div data-testid="cart-badge" data-count={count}>
      {children}
    </div>
  ),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn() },
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}));

const renderWithProviders = () =>
  render(
    <AuthProvider>
      <CartProvider>
        <MemoryRouter>
          <Categories />
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>
  );

describe("Categories page integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("cart", JSON.stringify([{ _id: "cart-1" }]));
  });

  // Zyon Aaronel Wee Zhun Wei, A0277598B
  it("fetches categories through the hook and renders them in both the page and layout header", async () => {
    axios.get.mockResolvedValue({
      data: {
        category: [
          { _id: "1", name: "Phones", slug: "phones" },
          { _id: "2", name: "Laptops", slug: "laptops" },
        ],
      },
    });

    renderWithProviders();

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
    );

    expect(await screen.findAllByRole("link", { name: "Phones" })).toHaveLength(2);
    expect(await screen.findAllByRole("link", { name: "Laptops" })).toHaveLength(2);
    expect(screen.getByRole("link", { name: /all categories/i })).toHaveAttribute(
      "href",
      "/categories"
    );
    expect(screen.getByRole("link", { name: /privacy policy/i })).toHaveAttribute(
      "href",
      "/policy"
    );
    expect(screen.getByTestId("cart-badge")).toHaveAttribute("data-count", "1");
    await waitFor(() => expect(document.title).toBe("All Categories"));
  });

  // Zyon Aaronel Wee Zhun Wei, A0277598B
  it("keeps the layout visible when category fetching fails", async () => {
    const error = new Error("network error");
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get.mockRejectedValue(error);

    renderWithProviders();

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
    );

    expect(screen.queryByRole("link", { name: "Phones" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute("href", "/");
    expect(screen.getByTestId("toaster")).toBeInTheDocument();
    expect(logSpy).toHaveBeenCalledWith(error);

    logSpy.mockRestore();
  });
});
