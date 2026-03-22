import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Layout from "./Layout";
import { AuthProvider } from "../context/auth";
import { CartProvider } from "../context/cart";
import useCategory from "../hooks/useCategory";

jest.mock("../hooks/useCategory", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("./Form/SearchInput", () => ({
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

const renderWithProviders = (ui) =>
  render(
    <AuthProvider>
      <CartProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </CartProvider>
    </AuthProvider>
  );

describe("Layout integration", () => {
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
  it("renders the real header and footer around page content with custom metadata", async () => {
    renderWithProviders(
      <Layout
        title="Custom Title"
        description="Custom description"
        keywords="alpha,beta"
        author="Zyon"
      >
        <div>Body Content</div>
      </Layout>
    );

    await waitFor(() => expect(document.title).toBe("Custom Title"));

    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute(
      "href",
      "/"
    );
    expect(screen.getByRole("link", { name: /all categories/i })).toHaveAttribute(
      "href",
      "/categories"
    );
    expect(screen.getByRole("link", { name: "Phones" })).toHaveAttribute(
      "href",
      "/category/phones"
    );
    expect(screen.getByRole("link", { name: /privacy policy/i })).toHaveAttribute(
      "href",
      "/policy"
    );
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
    expect(screen.getByTestId("cart-badge")).toHaveAttribute("data-count", "1");
    expect(screen.getByTestId("toaster")).toBeInTheDocument();
    expect(screen.getByText("Body Content")).toBeInTheDocument();
    expect(
      document.head.querySelector('meta[name="description"]')
    ).toHaveAttribute("content", "Custom description");
    expect(
      document.head.querySelector('meta[name="keywords"]')
    ).toHaveAttribute("content", "alpha,beta");
    expect(document.head.querySelector('meta[name="author"]')).toHaveAttribute(
      "content",
      "Zyon"
    );
  });

  // Zyon Aaronel Wee Zhun Wei, A0277598B
  it("uses the default metadata when no props are provided", async () => {
    renderWithProviders(
      <Layout>
        <div>Defaults</div>
      </Layout>
    );

    await waitFor(() =>
      expect(document.title).toBe("Ecommerce app - shop now")
    );

    expect(
      document.head.querySelector('meta[name="description"]')
    ).toHaveAttribute("content", "mern stack project");
    expect(
      document.head.querySelector('meta[name="keywords"]')
    ).toHaveAttribute("content", "mern,react,node,mongodb");
    expect(document.head.querySelector('meta[name="author"]')).toHaveAttribute(
      "content",
      "Techinfoyt"
    );
  });
});
