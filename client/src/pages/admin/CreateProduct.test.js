import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import toast from "react-hot-toast";
import { MemoryRouter } from "react-router-dom";
import CreateProduct from "./CreateProduct";

// ─── Module Mocks ────────────────────────────────────────────────────────────

jest.mock("axios");
jest.mock("react-hot-toast");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
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
  const MockSelect = ({ children, onChange, placeholder }) => (
    <select
      data-testid="select"
      data-placeholder={placeholder}
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

const mockCategories = [
  { _id: "cat1", name: "Electronics" },
  { _id: "cat2", name: "Books" },
];

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("CreateProduct", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories },
    });
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe("Rendering", () => {
    it("should render the Create Product heading", () => {
      // Arrange & Act
      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      // Assert
      expect(screen.getByText("Create Product")).toBeInTheDocument();
    });

    it("should render all required form fields", () => {
      // Arrange & Act
      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      // Assert
      expect(screen.getByPlaceholderText("write a name")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("write a description")
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("write a Price")
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("write a quantity")
      ).toBeInTheDocument();
      expect(screen.getByText("CREATE PRODUCT")).toBeInTheDocument();
    });

    it("should render a file upload input", () => {
      // Arrange & Act
      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      // Assert
      const fileInput = document.querySelector('input[type="file"][name="photo"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute("accept", "image/*");
    });
  });

  // ── Loading Categories ─────────────────────────────────────────────────────

  describe("Loading Categories", () => {
    it("should fetch categories from the API on mount", async () => {
      // Arrange & Act
      render(
        <MemoryRouter>
          <CreateProduct />
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
          <CreateProduct />
        </MemoryRouter>
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
        expect(screen.getByText("Books")).toBeInTheDocument();
      });
    });

    it("should show error toast when fetching categories fails", async () => {
      // Arrange
      axios.get.mockRejectedValueOnce(new Error("Network error"));

      // Act
      render(
        <MemoryRouter>
          <CreateProduct />
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

  // ── Form Interaction ───────────────────────────────────────────────────────

  describe("Form Interaction", () => {
    it("should update the name field as user types", () => {
      // Arrange
      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      // Act
      fireEvent.change(screen.getByPlaceholderText("write a name"), {
        target: { value: "iPhone 15" },
      });

      // Assert
      expect(screen.getByPlaceholderText("write a name").value).toBe(
        "iPhone 15"
      );
    });

    it("should update all text form fields as the user types", () => {
      // Arrange
      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      // Act
      fireEvent.change(screen.getByPlaceholderText("write a name"), {
        target: { value: "iPhone 15" },
      });
      fireEvent.change(screen.getByPlaceholderText("write a description"), {
        target: { value: "Latest iPhone model" },
      });
      fireEvent.change(screen.getByPlaceholderText("write a Price"), {
        target: { value: "999" },
      });
      fireEvent.change(screen.getByPlaceholderText("write a quantity"), {
        target: { value: "50" },
      });

      // Assert
      expect(screen.getByPlaceholderText("write a name").value).toBe(
        "iPhone 15"
      );
      expect(screen.getByPlaceholderText("write a description").value).toBe(
        "Latest iPhone model"
      );
      expect(screen.getByPlaceholderText("write a Price").value).toBe("999");
      expect(screen.getByPlaceholderText("write a quantity").value).toBe("50");
    });

    it("should display the file name label and image preview after photo upload", async () => {
      // Arrange
      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );
      const file = new File(["photo-content"], "product.jpg", {
        type: "image/jpeg",
      });
      const fileInput = document.querySelector(
        'input[type="file"][name="photo"]'
      );

      // Act
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Assert
      await waitFor(() => {
        expect(screen.getByText("product.jpg")).toBeInTheDocument();
        const previewImg = document.querySelector('img[alt="product_photo"]');
        expect(previewImg).toBeInTheDocument();
        expect(previewImg.src).toBe("blob:mock-url");
      });
    });

    it("should show Upload Photo label before a photo is selected", () => {
      // Arrange & Act
      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      // Assert
      expect(screen.getByText("Upload Photo")).toBeInTheDocument();
    });
  });

  // ── Creating a Product ─────────────────────────────────────────────────────

  describe("Creating a Product", () => {
    it("should show success toast and navigate to products when API returns success", async () => {
      // Arrange
      axios.post.mockResolvedValueOnce({ data: { success: true } });

      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      // Act
      fireEvent.click(screen.getByText("CREATE PRODUCT"));

      // Assert
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Product Created Successfully"
        );
        expect(mockNavigate).toHaveBeenCalledWith(
          "/dashboard/admin/products"
        );
      });
    });

    it("should show error toast when API returns a failure message", async () => {
      // Arrange
      axios.post.mockResolvedValueOnce({
        data: { success: false, message: "Product creation failed" },
      });

      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      // Act
      fireEvent.click(screen.getByText("CREATE PRODUCT"));

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Product creation failed");
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    it("should show error toast when axios.post throws an error", async () => {
      // Arrange – rejected promise is caught by the try-catch
      axios.post.mockRejectedValueOnce(new Error("Network error"));

      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      // Act
      fireEvent.click(screen.getByText("CREATE PRODUCT"));

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("something went wrong");
      });
    });

    it("should call axios.post with a FormData payload on create", async () => {
      // Arrange
      axios.post.mockResolvedValueOnce({ data: {} });

      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText("write a name"), {
        target: { value: "New Phone" },
      });

      // Act
      fireEvent.click(screen.getByText("CREATE PRODUCT"));

      // Assert
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          "/api/v1/product/create-product",
          expect.any(FormData)
        );
      });
    });
  });
});
