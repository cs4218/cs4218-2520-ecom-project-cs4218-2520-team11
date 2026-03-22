import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import About from "./About";
import { AuthProvider } from "../context/auth";
import { CartProvider } from "../context/cart";
import useCategory from "../hooks/useCategory";

jest.mock("../hooks/useCategory", () => ({
  __esModule: true,
  default: jest.fn(),
}));

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
          <About />
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>
  );

describe("About integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("cart", JSON.stringify([{ _id: "cart-1" }]));
    useCategory.mockReturnValue([
      { _id: "1", name: "Phones", slug: "phones" },
      { _id: "2", name: "Laptops", slug: "laptops" },
    ]);
  });

  // Zyon Aaronel Wee Zhun Wei, A0277598B
  it("renders the about page inside the real layout with shared navigation", async () => {
    renderWithProviders();

    await waitFor(() => expect(document.title).toBe("About us - Ecommerce app"));

    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute(
      "href",
      "/"
    );
    expect(screen.getByRole("link", { name: /about/i })).toHaveAttribute(
      "href",
      "/about"
    );
    expect(screen.getByRole("link", { name: /privacy policy/i })).toHaveAttribute(
      "href",
      "/policy"
    );
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
    expect(screen.getByAltText(/contactus/i)).toHaveAttribute(
      "src",
      "/images/about.jpeg"
    );
    expect(screen.getByText(/add text/i)).toBeInTheDocument();
  });
});
