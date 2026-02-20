import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import toast from "react-hot-toast";
import { MemoryRouter } from "react-router-dom";
import UpdateProduct from "./UpdateProduct";

// ─── Module Mocks ────────────────────────────────────────────────────────────

jest.mock("axios");
jest.mock("react-hot-toast");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => ({ slug: "test-product-slug" }),
}));

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

jest.mock("../../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout">
    <title>{title}</title>
    {children}
  </div>
));

jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">AdminMenu</div>
));

jest.mock("antd", () => {
  const MockSelect = ({ children, onChange, placeholder, value }) => (
    <select
      data-testid="select"
      value={value || ""}
      onChange={(e) => onChange && onChange(e.target.value)}
    >
      {children}
    </select>
  );
  MockSelect.Option = ({ children, value }) => (
    <option value={value}>{children}</option>
  );
  return { Select: MockSelect };
});

// ─── Test Helpers ────────────────────────────────────────────────────────────

global.URL.createObjectURL = jest.fn(() => "blob:mock-url");

window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

const mockProduct = {
  _id: "prod1",
  name: "Test Product",
  description: "A test product description",
  price: 99.99,
  quantity: 10,
  shipping: true,
  category: { _id: "cat1", name: "Electronics" },
};

const mockCategories = [
  { _id: "cat1", name: "Electronics" },
  { _id: "cat2", name: "Books" },
];

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("UpdateProduct", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Route different GET calls to their respective mocks
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/product/get-product/")) {
        return Promise.resolve({ data: { product: mockProduct } });
      }
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      }
      return Promise.resolve({ data: {} });
    });
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe("Rendering", () => {
    it("should render the Update Product heading", async () => {
      // Arrange & Act
      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      // Assert
      expect(screen.getByText("Update Product")).toBeInTheDocument();
    });

    it("should render the UPDATE PRODUCT and DELETE PRODUCT buttons", async () => {
      // Arrange & Act
      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      // Assert
      expect(screen.getByText("UPDATE PRODUCT")).toBeInTheDocument();
      expect(screen.getByText("DELETE PRODUCT")).toBeInTheDocument();
    });

    it("should display the existing product photo from the API by default", async () => {
      // Arrange & Act
      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      // Assert – existing photo shown via API URL before a new file is uploaded
      await waitFor(() => {
        const img = document.querySelector('img[alt="product_photo"]');
        expect(img).toBeInTheDocument();
        expect(img.src).toContain("/api/v1/product/product-photo/prod1");
      });
    });
  });

  // ── Loading Data on Mount ──────────────────────────────────────────────────

  describe("Loading Data on Mount", () => {
    it("should fetch product data using the slug from route params", async () => {
      // Arrange & Act
      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      // Assert
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/get-product/test-product-slug"
        );
      });
    });

    it("should pre-populate form fields with the existing product values", async () => {
      // Arrange & Act
      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByPlaceholderText("write a name").value).toBe(
          "Test Product"
        );
        expect(screen.getByPlaceholderText("write a description").value).toBe(
          "A test product description"
        );
        expect(screen.getByPlaceholderText("write a Price").value).toBe(
          "99.99"
        );
        expect(screen.getByPlaceholderText("write a quantity").value).toBe(
          "10"
        );
      });
    });

    it("should fetch all categories on mount", async () => {
      // Arrange & Act
      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      // Assert
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/category/get-category"
        );
      });
    });

    it("should display fetched categories in the category dropdown", async () => {
      // Arrange & Act
      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
        expect(screen.getByText("Books")).toBeInTheDocument();
      });
    });

    it("should show error toast when category fetch fails", async () => {
      // Arrange
      axios.get.mockImplementation((url) => {
        if (url.includes("/api/v1/product/get-product/")) {
          return Promise.resolve({ data: { product: mockProduct } });
        }
        return Promise.reject(new Error("Network error"));
      });

      // Act
      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Something wwent wrong in getting catgeory"
        );
      });
    });
  });

  // ── Photo Upload ───────────────────────────────────────────────────────────

  describe("Photo Upload", () => {
    it("should show blob preview and file name when a new photo is selected", async () => {
      // Arrange
      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );
      const file = new File(["content"], "new-photo.jpg", {
        type: "image/jpeg",
      });
      const fileInput = document.querySelector(
        'input[type="file"][name="photo"]'
      );

      // Act
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Assert
      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalledWith(file);
        expect(screen.getByText("new-photo.jpg")).toBeInTheDocument();
        const img = document.querySelector('img[alt="product_photo"]');
        expect(img.src).toBe("blob:mock-url");
      });
    });
  });

  // ── Updating a Product ─────────────────────────────────────────────────────

  describe("Updating a Product", () => {
    it("should show success toast and navigate when API returns success", async () => {
      // Arrange
      axios.put.mockResolvedValueOnce({ data: { success: true } });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText("write a name").value).toBe(
          "Test Product"
        );
      });

      // Act
      fireEvent.click(screen.getByText("UPDATE PRODUCT"));

      // Assert
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Product Updated Successfully"
        );
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
      });
    });

    it("should show error toast when API returns a failure message", async () => {
      // Arrange
      axios.put.mockResolvedValueOnce({
        data: { success: false, message: "Update failed" },
      });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText("write a name").value).toBe(
          "Test Product"
        );
      });

      // Act
      fireEvent.click(screen.getByText("UPDATE PRODUCT"));

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Update failed");
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    it("should call axios.put with a FormData payload pointing to the correct product", async () => {
      // Arrange
      axios.put.mockResolvedValueOnce({ data: { success: true } });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText("write a name").value).toBe(
          "Test Product"
        );
      });

      // Act
      fireEvent.click(screen.getByText("UPDATE PRODUCT"));

      // Assert
      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          "/api/v1/product/update-product/prod1",
          expect.any(FormData)
        );
      });
    });

    it("should show error toast when axios.put rejects with an error", async () => {
      // Arrange
      axios.put.mockRejectedValueOnce(new Error("Network error"));

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText("write a name").value).toBe(
          "Test Product"
        );
      });

      // Act
      fireEvent.click(screen.getByText("UPDATE PRODUCT"));

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("something went wrong");
      });
    });
  });

  // ── Deleting a Product ─────────────────────────────────────────────────────

  describe("Deleting a Product", () => {
    it("should call DELETE API and navigate when user confirms the prompt", async () => {
      // Arrange
      window.prompt = jest.fn().mockReturnValue("yes");
      axios.delete.mockResolvedValueOnce({ data: { success: true } });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText("write a name").value).toBe(
          "Test Product"
        );
      });

      // Act
      fireEvent.click(screen.getByText("DELETE PRODUCT"));

      // Assert
      await waitFor(() => {
        expect(axios.delete).toHaveBeenCalledWith(
          "/api/v1/product/delete-product/prod1"
        );
        expect(toast.success).toHaveBeenCalledWith("Product DEleted Succfully");
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
      });
    });

    it("should not call DELETE API when user cancels the confirmation prompt", async () => {
      // Arrange
      window.prompt = jest.fn().mockReturnValue(null);

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      // Act
      fireEvent.click(screen.getByText("DELETE PRODUCT"));

      // Assert
      await waitFor(() => {
        expect(axios.delete).not.toHaveBeenCalled();
      });
    });

    it("should not call DELETE API when user submits empty string to prompt", async () => {
      // Arrange
      window.prompt = jest.fn().mockReturnValue("");

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      // Act
      fireEvent.click(screen.getByText("DELETE PRODUCT"));

      // Assert
      await waitFor(() => {
        expect(axios.delete).not.toHaveBeenCalled();
      });
    });

    it("should show error toast when delete request throws an error", async () => {
      // Arrange
      window.prompt = jest.fn().mockReturnValue("yes");
      axios.delete.mockRejectedValueOnce(new Error("Network error"));

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText("write a name").value).toBe(
          "Test Product"
        );
      });

      // Act
      fireEvent.click(screen.getByText("DELETE PRODUCT"));

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Something went wrong");
      });
    });
  });
});
