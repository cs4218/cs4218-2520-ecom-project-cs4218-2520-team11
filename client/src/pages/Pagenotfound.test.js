import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Pagenotfound from "./Pagenotfound";
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
        <MemoryRouter initialEntries={["/missing"]}>
          <Routes>
            <Route path="/missing" element={<Pagenotfound />} />
            <Route path="/" element={<h1>Home Page</h1>} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    </AuthProvider>
  );

describe("Pagenotfound integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("cart", JSON.stringify([{ _id: "cart-1" }]));
    useCategory.mockReturnValue([]);
  });

  // Zyon Aaronel Wee Zhun Wei, A0277598B
  it("renders the 404 page in the real layout and navigates back home", async () => {
    renderWithProviders();

    await waitFor(() => expect(document.title).toBe("go back- page not found"));

    expect(screen.getByRole("heading", { name: "404" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /oops ! page not found/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go back/i })).toHaveAttribute(
      "href",
      "/"
    );
    expect(screen.getByRole("link", { name: /privacy policy/i })).toHaveAttribute(
      "href",
      "/policy"
    );

    fireEvent.click(screen.getByRole("link", { name: /go back/i }));

    expect(screen.getByRole("heading", { name: /home page/i })).toBeInTheDocument();
  });
});
