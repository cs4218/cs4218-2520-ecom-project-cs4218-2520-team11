import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import AdminDashboard from "./AdminDashboard";
import { AuthProvider } from "../../context/auth";
import { CartProvider } from "../../context/cart";

jest.mock("axios");

jest.mock("../../components/Form/SearchInput", () => ({
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
          <AdminDashboard />
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>
  );

describe("AdminDashboard integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: {
          name: "Admin",
          email: "admin@example.com",
          phone: "1234",
          role: 1,
        },
        token: "token-123",
      })
    );
    axios.get.mockResolvedValue({ data: { category: [] } });
  });

  // Zyon Aaronel Wee Zhun Wei, A0277598B
  it("renders the real layout, admin menu, and auth-backed admin details together", async () => {
    renderWithProviders();

    await waitFor(() =>
      expect(screen.getAllByText(/admin/i).length).toBeGreaterThan(0)
    );

    expect(screen.getByText(/Admin Name : Admin/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin Email : admin@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin Contact : 1234/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /create category/i })).toHaveAttribute(
      "href",
      "/dashboard/admin/create-category"
    );
    expect(screen.getByRole("link", { name: /create product/i })).toHaveAttribute(
      "href",
      "/dashboard/admin/create-product"
    );
    expect(screen.getByRole("link", { name: /^products$/i })).toHaveAttribute(
      "href",
      "/dashboard/admin/products"
    );
    expect(screen.getByRole("link", { name: /^orders$/i })).toHaveAttribute(
      "href",
      "/dashboard/admin/orders"
    );
    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute(
      "href",
      "/dashboard/admin"
    );
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
    await waitFor(() =>
      expect(document.title).toBe("Ecommerce app - shop now")
    );
  });
});
