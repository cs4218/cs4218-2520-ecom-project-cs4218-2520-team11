import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import CreateCategory from "./CreateCategory";
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
  Modal: ({ children, visible, open }) =>
    visible || open ? <div data-testid="modal">{children}</div> : null,
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}));

const toast = jest.requireMock("react-hot-toast").default;

const baseCategories = [
  { _id: "cat-1", name: "Electronics", slug: "electronics" },
  { _id: "cat-2", name: "Books", slug: "books" },
];

const renderWithProviders = () =>
  render(
    <AuthProvider>
      <CartProvider>
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>
  );

describe("CreateCategory integration", () => {
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
    localStorage.setItem("cart", JSON.stringify([{ _id: "cart-1" }]));
  });

  // Zyon Aaronel Wee Zhun Wei, A0277598B
  it("loads categories into the real admin page with layout and menu navigation", async () => {
    axios.get.mockResolvedValue({ data: { success: true, category: baseCategories } });

    await act(async () => {
      renderWithProviders();
    });

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
    );
    expect(await screen.findByRole("cell", { name: "Electronics" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Books" })).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: /manage category/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /create category/i })).toHaveAttribute(
      "href",
      "/dashboard/admin/create-category"
    );
    expect(screen.getByRole("link", { name: /create product/i })).toHaveAttribute(
      "href",
      "/dashboard/admin/create-product"
    );
    expect(screen.getByRole("link", { name: /^orders$/i })).toHaveAttribute(
      "href",
      "/dashboard/admin/orders"
    );
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
    await waitFor(() =>
      expect(document.title).toBe("Dashboard - Create Category")
    );
  });

  // Zyon Aaronel Wee Zhun Wei, A0277598B
  it("submits a new category through the real form and refreshes the category table", async () => {
    let categories = [...baseCategories];

    axios.get.mockImplementation(() =>
      Promise.resolve({ data: { success: true, category: categories } })
    );
    axios.post.mockImplementation((_url, body) => {
      categories = [
        ...categories,
        {
          _id: "cat-3",
          name: body.name,
          slug: body.name.toLowerCase().replace(/\s+/g, "-"),
        },
      ];
      return Promise.resolve({ data: { success: true } });
    });

    await act(async () => {
      renderWithProviders();
    });

    await screen.findByRole("cell", { name: "Electronics" });

    fireEvent.change(screen.getByPlaceholderText("Enter new category"), {
      target: { value: "Wearables" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/category/create-category",
        { name: "Wearables" }
      )
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Wearables is created"));
    expect(await screen.findByRole("cell", { name: "Wearables" })).toBeInTheDocument();
  });
});
