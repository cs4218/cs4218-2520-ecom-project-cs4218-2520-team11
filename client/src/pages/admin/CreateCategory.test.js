import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import toast from "react-hot-toast";
import { MemoryRouter } from "react-router-dom";
import CreateCategory from "./CreateCategory";

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

jest.mock("../../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout">
    <title>{title}</title>
    {children}
  </div>
));

jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">AdminMenu</div>
));

// Supports both antd v4 (visible) and v5 (open)
jest.mock("antd", () => ({
  Modal: ({ children, visible, open, onCancel }) =>
    visible || open ? (
      <div data-testid="modal">{children}</div>
    ) : null,
}));

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

const mockCategories = [
  { _id: "cat1", name: "Electronics" },
  { _id: "cat2", name: "Books" },
];

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("CreateCategory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories },
    });
  });

  // ── Initial Rendering ──────────────────────────────────────────────────────

  describe("Initial Rendering", () => {
    it("should render the Manage Category heading", () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange & Act
      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      // Assert
      expect(screen.getByText("Manage Category")).toBeInTheDocument();
    });

    it("should render the category form with input and submit button", () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange & Act
      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      // Assert
      expect(
        screen.getByPlaceholderText("Enter new category")
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /submit/i })
      ).toBeInTheDocument();
    });

    it("should render the AdminMenu component", () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange & Act
      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      // Assert
      expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
    });
  });

  // ── Loading Categories ─────────────────────────────────────────────────────

  describe("Loading Categories", () => {
    it("should fetch all categories from the API on mount", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange & Act
      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      // Assert
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/category/get-category"
        );
      });
    });

    it("should display fetched categories in the table", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange & Act
      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
        expect(screen.getByText("Books")).toBeInTheDocument();
      });
    });

    it("should render Edit and Delete buttons for each category", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange & Act
      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      // Assert
      await waitFor(() => {
        const editButtons = screen.getAllByText("Edit");
        const deleteButtons = screen.getAllByText("Delete");
        expect(editButtons).toHaveLength(mockCategories.length);
        expect(deleteButtons).toHaveLength(mockCategories.length);
      });
    });

    it("should show error toast when fetching categories fails", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      axios.get.mockRejectedValueOnce(new Error("Network error"));

      // Act
      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Something went wrong in getting category"
        );
      });
    });
  });

  // ── Creating a Category ────────────────────────────────────────────────────

  describe("Creating a Category", () => {
    it("should call POST API and show success toast when category is created", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      axios.post.mockResolvedValueOnce({
        data: { success: true },
      });

      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      // Act
      fireEvent.change(screen.getByPlaceholderText("Enter new category"), {
        target: { value: "Clothing" },
      });
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      // Assert
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          "/api/v1/category/create-category",
          { name: "Clothing" }
        );
        expect(toast.success).toHaveBeenCalledWith("Clothing is created");
      });
    });

    it("should refetch categories after successful creation", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      axios.post.mockResolvedValueOnce({ data: { success: true } });

      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      // Act
      fireEvent.change(screen.getByPlaceholderText("Enter new category"), {
        target: { value: "Clothing" },
      });
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      // Assert
      await waitFor(() => {
        // axios.get called once on mount, once after creation
        expect(axios.get).toHaveBeenCalledTimes(2);
      });
    });

    it("should show error toast when API returns success: false", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      axios.post.mockResolvedValueOnce({
        data: { success: false, message: "Category already exists" },
      });

      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      // Act
      fireEvent.change(screen.getByPlaceholderText("Enter new category"), {
        target: { value: "Electronics" },
      });
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Category already exists");
      });
    });

    it("should show error toast when POST request throws an exception", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      axios.post.mockRejectedValueOnce(new Error("Network error"));

      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      // Act
      fireEvent.change(screen.getByPlaceholderText("Enter new category"), {
        target: { value: "Clothing" },
      });
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "something went wrong in input form"
        );
      });
    });
  });

  // ── Editing a Category ─────────────────────────────────────────────────────

  describe("Editing a Category", () => {
    it("should open the modal when an Edit button is clicked", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      // Act
      fireEvent.click(screen.getAllByText("Edit")[0]);

      // Assert
      expect(screen.getByTestId("modal")).toBeInTheDocument();
    });

    it("should pre-fill the modal input with the selected category name", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      // Act
      fireEvent.click(screen.getAllByText("Edit")[0]);

      // Assert – modal's CategoryForm shows the category name
      const inputs = screen.getAllByPlaceholderText("Enter new category");
      // The modal renders a second CategoryForm, so there are 2 inputs
      expect(inputs[inputs.length - 1].value).toBe("Electronics");
    });

    it("should call PUT API and show success toast when update succeeds", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      axios.put.mockResolvedValueOnce({ data: { success: true } });

      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      // Act
      fireEvent.click(screen.getAllByText("Edit")[0]);
      const submitButtons = screen.getAllByRole("button", { name: /submit/i });
      fireEvent.click(submitButtons[submitButtons.length - 1]);

      // Assert
      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          "/api/v1/category/update-category/cat1",
          { name: "Electronics" }
        );
        expect(toast.success).toHaveBeenCalledWith("Electronics is updated");
      });
    });

    it("should close the modal after a successful update", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      axios.put.mockResolvedValueOnce({ data: { success: true } });

      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText("Edit")[0]);
      expect(screen.getByTestId("modal")).toBeInTheDocument();

      // Act
      const submitButtons = screen.getAllByRole("button", { name: /submit/i });
      fireEvent.click(submitButtons[submitButtons.length - 1]);

      // Assert
      await waitFor(() => {
        expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
      });
    });

    it("should show error toast when update API returns success: false", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      axios.put.mockResolvedValueOnce({
        data: { success: false, message: "Update failed" },
      });

      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      // Act
      fireEvent.click(screen.getAllByText("Edit")[0]);
      const submitButtons = screen.getAllByRole("button", { name: /submit/i });
      fireEvent.click(submitButtons[submitButtons.length - 1]);

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Update failed");
      });
    });

    it("should show error toast when PUT request throws an exception", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      axios.put.mockRejectedValueOnce(new Error("Network error"));

      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      // Act
      fireEvent.click(screen.getAllByText("Edit")[0]);
      const submitButtons = screen.getAllByRole("button", { name: /submit/i });
      fireEvent.click(submitButtons[submitButtons.length - 1]);

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Something went wrong");
      });
    });
  });

  // ── Deleting a Category ────────────────────────────────────────────────────

  describe("Deleting a Category", () => {
    it("should call DELETE API with correct id and show success toast", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      axios.delete.mockResolvedValueOnce({ data: { success: true } });

      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      // Act
      fireEvent.click(screen.getAllByText("Delete")[0]);

      // Assert
      await waitFor(() => {
        expect(axios.delete).toHaveBeenCalledWith(
          "/api/v1/category/delete-category/cat1"
        );
        expect(toast.success).toHaveBeenCalledWith("category is deleted");
      });
    });

    it("should refetch categories after successful deletion", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      axios.delete.mockResolvedValueOnce({ data: { success: true } });

      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      const callsBefore = axios.get.mock.calls.length;

      // Act
      fireEvent.click(screen.getAllByText("Delete")[0]);

      // Assert
      await waitFor(() => {
        expect(axios.get.mock.calls.length).toBeGreaterThan(callsBefore);
      });
    });

    it("should show error toast when delete API returns success: false", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      axios.delete.mockResolvedValueOnce({
        data: { success: false, message: "Delete failed" },
      });

      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      // Act
      fireEvent.click(screen.getAllByText("Delete")[0]);

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Delete failed");
      });
    });

    it("should show error toast when DELETE request throws an exception", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      axios.delete.mockRejectedValueOnce(new Error("Network error"));

      render(
        <MemoryRouter>
          <CreateCategory />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      // Act
      fireEvent.click(screen.getAllByText("Delete")[0]);

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Something went wrong");
      });
    });
  });
});
