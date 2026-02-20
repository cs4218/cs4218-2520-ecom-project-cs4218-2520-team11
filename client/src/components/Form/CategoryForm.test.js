import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import CategoryForm from "./CategoryForm";

describe("CategoryForm", () => {
  const mockHandleSubmit = jest.fn((e) => e.preventDefault());
  const mockSetValue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Rendering ────────────────────────────────────────────────────────────

  describe("Rendering", () => {
    it("should render an input field and a submit button", () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      render(
        <CategoryForm
          handleSubmit={mockHandleSubmit}
          value=""
          setValue={mockSetValue}
        />
      );

      // Assert
      expect(
        screen.getByPlaceholderText("Enter new category")
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /submit/i })
      ).toBeInTheDocument();
    });

    it("should display the current value passed via the value prop", () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      render(
        <CategoryForm
          handleSubmit={mockHandleSubmit}
          value="Electronics"
          setValue={mockSetValue}
        />
      );

      // Assert
      expect(screen.getByPlaceholderText("Enter new category").value).toBe(
        "Electronics"
      );
    });

    it("should render with an empty input when value is an empty string", () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      render(
        <CategoryForm
          handleSubmit={mockHandleSubmit}
          value=""
          setValue={mockSetValue}
        />
      );

      // Assert
      expect(screen.getByPlaceholderText("Enter new category").value).toBe("");
    });
  });

  // ─── User Interaction ─────────────────────────────────────────────────────

  describe("User Interaction", () => {
    it("should call setValue with the typed value when input changes", () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      render(
        <CategoryForm
          handleSubmit={mockHandleSubmit}
          value=""
          setValue={mockSetValue}
        />
      );

      // Act
      fireEvent.change(screen.getByPlaceholderText("Enter new category"), {
        target: { value: "Books" },
      });

      // Assert
      expect(mockSetValue).toHaveBeenCalledWith("Books");
      expect(mockSetValue).toHaveBeenCalledTimes(1);
    });

    it("should call setValue with empty string when input is cleared", () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      render(
        <CategoryForm
          handleSubmit={mockHandleSubmit}
          value="Electronics"
          setValue={mockSetValue}
        />
      );

      // Act
      fireEvent.change(screen.getByPlaceholderText("Enter new category"), {
        target: { value: "" },
      });

      // Assert
      expect(mockSetValue).toHaveBeenCalledWith("");
    });

    it("should call handleSubmit when the submit button is clicked", () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      render(
        <CategoryForm
          handleSubmit={mockHandleSubmit}
          value="Electronics"
          setValue={mockSetValue}
        />
      );

      // Act
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      // Assert
      expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
    });

    it("should call handleSubmit when the form is submitted directly", () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      const { container } = render(
        <CategoryForm
          handleSubmit={mockHandleSubmit}
          value="Electronics"
          setValue={mockSetValue}
        />
      );

      // Act
      fireEvent.submit(container.querySelector("form"));

      // Assert
      expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
    });

    it("should not call handleSubmit when only the input changes", () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      render(
        <CategoryForm
          handleSubmit={mockHandleSubmit}
          value=""
          setValue={mockSetValue}
        />
      );

      // Act
      fireEvent.change(screen.getByPlaceholderText("Enter new category"), {
        target: { value: "New Category" },
      });

      // Assert
      expect(mockHandleSubmit).not.toHaveBeenCalled();
    });
  });
});
