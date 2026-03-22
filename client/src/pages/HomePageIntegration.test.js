// Gabriel Seethor, A0257008H (Whole File)
import React from "react";
import {
  render,
  screen,
  act,
  waitFor,
  fireEvent,
  within,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import HomePage from "../pages/HomePage";
import ProductDetails from "../pages/ProductDetails";
import { useCart } from "../context/cart";

jest.mock("axios");

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

const mockSetAuth = jest.fn();
const mockSetCart = jest.fn();
let mockCartItems = [];

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(() => [null, mockSetAuth]),
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [[], jest.fn()]),
}));

jest.mock("../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

jest.mock("../hooks/useCategory", () => ({
  __esModule: true,
  default: jest.fn(() => {
    const categories = [
      { _id: "cat1", name: "Electronics", slug: "electronics" },
      { _id: "cat2", name: "Books", slug: "books" },
      { _id: "cat3", name: "Clothing", slug: "clothing" },
    ];
    return [categories, jest.fn()];
  }),
}));

describe("HomePage Integration Tests", () => {
  const mockProducts = [
    {
      _id: "1",
      name: "iPhone 13",
      description: "Latest Apple smartphone with A15 chip",
      price: 999,
      category: { _id: "cat1", name: "Electronics" },
      slug: "iphone-13",
      quantity: 99,
    },
    {
      _id: "2",
      name: "MacBook Pro",
      description: "16-inch with M1 Pro chip",
      price: 2499,
      category: { _id: "cat1", name: "Electronics" },
      slug: "macbook-pro",
      quantity: 50,
    },
    {
      _id: "3",
      name: "Harry Potter Book",
      description: "Complete collection fantasy novel",
      price: 39,
      category: { _id: "cat2", name: "Books" },
      slug: "harry-potter",
      quantity: 20,
    },
  ];

  const categories = [
    { _id: "cat1", name: "Electronics", slug: "electronics" },
    { _id: "cat2", name: "Books", slug: "books" },
    { _id: "cat3", name: "Clothing", slug: "clothing" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockCartItems = [];
    mockSetCart.mockImplementation((newCart) => {
      mockCartItems = newCart;
    });

    useCart.mockReturnValue([[], mockSetCart]); // ← now the component gets mockSetCart

    Storage.prototype.setItem = jest.fn();

    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: { success: true, category: categories },
        });
      }
      if (url.includes("/api/v1/product/product-list/1")) {
        return Promise.resolve({
          data: { products: mockProducts },
        });
      }
      if (url.includes("/api/v1/product/product-count")) {
        return Promise.resolve({
          data: { total: mockProducts.length },
        });
      }
      return Promise.reject(new Error("Not mocked: " + url));
    });
  });

  // TEST 1: Reset filters shows all products
  it("should reset all filters and show all products", async () => {
    // Mock reload
    const mockReload = jest.fn();
    Object.defineProperty(window, "location", {
      value: { reload: mockReload },
      writable: true,
    });

    // Mock filter API response for filtering
    axios.post.mockResolvedValueOnce({
      data: {
        products: mockProducts.filter((p) => p.category.name === "Electronics"),
      },
    });

    const { unmount } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    // Wait for initial load and verify all products are there
    await screen.findByText("iPhone 13");
    await screen.findByText("MacBook Pro");
    await screen.findByText("Harry Potter Book");

    console.log("Initial load - all products present");

    // Apply Electronics filter
    const electronicsLabel = screen.getByText("Electronics");
    fireEvent.click(electronicsLabel);

    // Wait for filter to apply and verify Harry Potter is gone
    await waitFor(() => {
      expect(screen.queryByText("Harry Potter Book")).not.toBeInTheDocument();
    });

    console.log("After filter - Harry Potter removed");

    // Click reset button
    const resetButton = screen.getByRole("button", { name: /reset filters/i });
    fireEvent.click(resetButton);

    // Verify reload was called
    expect(mockReload).toHaveBeenCalled();

    // Unmount and remount to simulate page reload
    unmount();

    // Reset axios mock to return all products
    axios.get.mockImplementation((url) => {
      console.log("API call after remount:", url);

      if (url.includes("/api/v1/category/get-category")) {
        console.log("Returning categories:", categories);
        return Promise.resolve({
          data: { success: true, category: categories },
        });
      }
      if (url.includes("/api/v1/product/product-list/1")) {
        console.log("Returning products:", mockProducts);
        return Promise.resolve({
          data: { products: mockProducts },
        });
      }
      if (url.includes("/api/v1/product/product-count")) {
        console.log("Returning count:", mockProducts.length);
        return Promise.resolve({
          data: { total: mockProducts.length },
        });
      }
      return Promise.reject(new Error("Not mocked: " + url));
    });

    // Remount the component
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    // Wait for products to load and check what's actually there
    await waitFor(() => {
      const products = screen.queryAllByText(
        /iPhone 13|MacBook Pro|Harry Potter Book/,
      );
      console.log("Products found after remount:", products.length);
      products.forEach((p) => console.log("Found:", p.textContent));
    });

    // Now try to find Harry Potter specifically
    await waitFor(
      () => {
        expect(screen.getByText("iPhone 13")).toBeInTheDocument();
        expect(screen.getByText("MacBook Pro")).toBeInTheDocument();
        expect(screen.getByText("Harry Potter Book")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  // TEST 2: Navigation to product details works
  it("should navigate to product details page when clicking More Details", async () => {
    jest.clearAllMocks();

    // Setup axios mocks
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: { success: true, category: categories },
        });
      }

      if (url.includes("/api/v1/product/product-list/")) {
        return Promise.resolve({
          data: { products: mockProducts },
        });
      }

      if (url.includes("/api/v1/product/product-count")) {
        return Promise.resolve({
          data: { total: mockProducts.length },
        });
      }

      if (url.includes("/api/v1/product/get-product/")) {
        const slug = url.split("/api/v1/product/get-product/")[1];
        console.log("Getting product with slug:", slug);

        const product = mockProducts.find((p) => p.slug === slug);

        if (product) {
          return Promise.resolve({
            data: {
              product: {
                ...product,
                category: {
                  _id: product.category._id,
                  name: product.category.name,
                },
              },
              success: true,
            },
          });
        }
      }

      if (url.includes("/api/v1/product/related-product/")) {
        return Promise.resolve({
          data: { products: [] },
        });
      }

      return Promise.reject(new Error("Not mocked: " + url));
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:slug" element={<ProductDetails />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByText("iPhone 13");

    const productCards = screen
      .getAllByRole("generic")
      .filter((element) => element.className?.includes("card m-2"));

    const iphoneCard = productCards.find((card) =>
      card.textContent.includes("iPhone 13"),
    );

    const moreDetailsButton = within(iphoneCard).getByText("More Details");
    fireEvent.click(moreDetailsButton);

    await waitFor(
      () => {
        expect(screen.getByText("Product Details")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    await waitFor(
      () => {
        // Check for the product name - the DOM shows it's on the same line as "Name :"
        expect(
          screen.getByText((content, element) => {
            return (
              element.tagName.toLowerCase() === "h6" &&
              content.includes("Name :") &&
              content.includes("iPhone 13")
            );
          }),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    expect(
      screen.getByText((content, element) => {
        return (
          element.tagName.toLowerCase() === "h6" &&
          content.includes("Description :") &&
          content.includes("Latest Apple smartphone")
        );
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText((content, element) => {
        return (
          element.tagName.toLowerCase() === "h6" &&
          content.includes("Price :") &&
          content.includes("$999")
        );
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText((content, element) => {
        return (
          element.tagName.toLowerCase() === "h6" &&
          content.includes("Category :") &&
          content.includes("Electronics")
        );
      }),
    ).toBeInTheDocument();
  });

  // TEST 3: Add to cart works
  it("should add item to cart when clicking ADD TO CART", async () => {
    mockCartItems = [];

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    await screen.findByText("iPhone 13");

    const addToCartButtons = await screen.findAllByText("ADD TO CART");

    for (const button of addToCartButtons) {
      const card = button.closest(".card");
      if (card && card.textContent.includes("iPhone 13")) {
        fireEvent.click(button);
        break;
      }
    }

    // Wrap all post-click assertions in waitFor
    await waitFor(() => {
      expect(mockSetCart).toHaveBeenCalled();

      const setCartCall = mockSetCart.mock.calls[0][0];
      expect(Array.isArray(setCartCall)).toBe(true);
      expect(setCartCall.length).toBe(1);
      expect(setCartCall[0]._id).toBe("1");
      expect(setCartCall[0].name).toBe("iPhone 13");

      expect(localStorage.setItem).toHaveBeenCalledWith(
        "cart",
        JSON.stringify(setCartCall),
      );
    });
  });

  // TEST 4: Load more products works
  it("should load more products when clicking Load More", async () => {
    const moreProducts = [
      {
        _id: "4",
        name: "iPad Pro",
        description: "12.9-inch tablet",
        price: 1099,
        category: { _id: "cat1", name: "Electronics" },
        slug: "ipad-pro",
        quantity: 8,
      },
    ];

    // Mock first page load and subsequent page load
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: { success: true, category: categories },
        });
      }
      if (url.includes("/api/v1/product/product-list/1")) {
        return Promise.resolve({
          data: { products: mockProducts },
        });
      }
      if (url.includes("/api/v1/product/product-list/2")) {
        return Promise.resolve({
          data: { products: moreProducts },
        });
      }
      if (url.includes("/api/v1/product/product-count")) {
        return Promise.resolve({
          data: { total: 4 },
        });
      }
      return Promise.reject(new Error("Not mocked: " + url));
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    // Wait for initial products
    await screen.findByText("iPhone 13");
    await screen.findByText("MacBook Pro");
    await screen.findByText("Harry Potter Book");

    // iPad Pro should not be visible yet
    expect(screen.queryByText("iPad Pro")).not.toBeInTheDocument();

    // Click Load More
    const loadMoreButton = screen.getByText(/load more/i);
    fireEvent.click(loadMoreButton);

    // Wait for new product to appear
    await waitFor(
      () => {
        expect(screen.getByText("iPad Pro")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Original products should still be there
    expect(screen.getByText("iPhone 13")).toBeInTheDocument();
    expect(screen.getByText("MacBook Pro")).toBeInTheDocument();
    expect(screen.getByText("Harry Potter Book")).toBeInTheDocument();
  });

  // TEST 5: Empty filter results
  it("should show no products when filter returns empty", async () => {
    // Mock filter API response with empty array
    axios.post.mockResolvedValueOnce({
      data: { products: [] },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    // Wait for initial load
    await screen.findByText("iPhone 13");

    // Apply Books filter
    const booksLabel = screen.getByText("Books");
    fireEvent.click(booksLabel);

    // Wait for filter to apply - all products should disappear
    await waitFor(
      () => {
        expect(screen.queryByText("iPhone 13")).not.toBeInTheDocument();
        expect(screen.queryByText("MacBook Pro")).not.toBeInTheDocument();
        expect(screen.queryByText("Harry Potter Book")).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });
});
