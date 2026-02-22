import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import SearchInput from "./SearchInput";

// ─── Module Mocks ────────────────────────────────────────────────────────────

jest.mock("axios");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const mockSetValues = jest.fn();
jest.mock("../../context/search", () => ({
  useSearch: jest.fn(),
}));

import { useSearch } from "../../context/search";

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("SearchInput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSearch.mockReturnValue([{ keyword: "" }, mockSetValues]);
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe("Rendering", () => {
    it("should render the search input field", () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange & Act
      render(
        <MemoryRouter>
          <SearchInput />
        </MemoryRouter>
      );

      // Assert
      expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
    });

    it("should render the Search submit button", () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange & Act
      render(
        <MemoryRouter>
          <SearchInput />
        </MemoryRouter>
      );

      // Assert
      expect(
        screen.getByRole("button", { name: /search/i })
      ).toBeInTheDocument();
    });

    it("should display the current keyword value from context in the input", () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      useSearch.mockReturnValue([{ keyword: "laptop" }, mockSetValues]);

      // Act
      render(
        <MemoryRouter>
          <SearchInput />
        </MemoryRouter>
      );

      // Assert
      expect(screen.getByPlaceholderText("Search").value).toBe("laptop");
    });

    it("should render a form with role search", () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange & Act
      render(
        <MemoryRouter>
          <SearchInput />
        </MemoryRouter>
      );

      // Assert
      expect(screen.getByRole("search")).toBeInTheDocument();
    });
  });

  // ── User Interaction ───────────────────────────────────────────────────────

  describe("User Interaction", () => {
    it("should call setValues with the updated keyword when user types", () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      render(
        <MemoryRouter>
          <SearchInput />
        </MemoryRouter>
      );

      // Act
      fireEvent.change(screen.getByPlaceholderText("Search"), {
        target: { value: "iphone" },
      });

      // Assert
      expect(mockSetValues).toHaveBeenCalledWith({
        keyword: "iphone",
        results: undefined,
      });
    });

    it("should preserve existing context values when updating keyword", () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      useSearch.mockReturnValue([
        { keyword: "old", results: [{ _id: "p1" }] },
        mockSetValues,
      ]);

      render(
        <MemoryRouter>
          <SearchInput />
        </MemoryRouter>
      );

      // Act
      fireEvent.change(screen.getByPlaceholderText("Search"), {
        target: { value: "new" },
      });

      // Assert
      expect(mockSetValues).toHaveBeenCalledWith({
        keyword: "new",
        results: [{ _id: "p1" }],
      });
    });
  });

  // ── Search Submission ──────────────────────────────────────────────────────

  describe("Search Submission", () => {
    it("should call axios.get with the correct search URL when the form is submitted", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      useSearch.mockReturnValue([{ keyword: "phone" }, mockSetValues]);
      axios.get.mockResolvedValueOnce({ data: [] });

      render(
        <MemoryRouter>
          <SearchInput />
        </MemoryRouter>
      );

      // Act
      fireEvent.submit(screen.getByRole("search"));

      // Assert
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/search/phone"
        );
      });
    });

    it("should call setValues with the results returned from the API", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      const mockResults = [{ _id: "prod1", name: "iPhone 15" }];
      useSearch.mockReturnValue([{ keyword: "iphone" }, mockSetValues]);
      axios.get.mockResolvedValueOnce({ data: mockResults });

      render(
        <MemoryRouter>
          <SearchInput />
        </MemoryRouter>
      );

      // Act
      fireEvent.submit(screen.getByRole("search"));

      // Assert
      await waitFor(() => {
        expect(mockSetValues).toHaveBeenCalledWith({
          keyword: "iphone",
          results: mockResults,
        });
      });
    });

    it("should navigate to /search after a successful search", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      useSearch.mockReturnValue([{ keyword: "macbook" }, mockSetValues]);
      axios.get.mockResolvedValueOnce({ data: [] });

      render(
        <MemoryRouter>
          <SearchInput />
        </MemoryRouter>
      );

      // Act
      fireEvent.submit(screen.getByRole("search"));

      // Assert
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/search");
      });
    });

    it("should also submit when the Search button is clicked", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      useSearch.mockReturnValue([{ keyword: "tablet" }, mockSetValues]);
      axios.get.mockResolvedValueOnce({ data: [] });

      render(
        <MemoryRouter>
          <SearchInput />
        </MemoryRouter>
      );

      // Act
      fireEvent.click(screen.getByRole("button", { name: /search/i }));

      // Assert
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/search/tablet"
        );
        expect(mockNavigate).toHaveBeenCalledWith("/search");
      });
    });
  });

  // ── Error Handling ─────────────────────────────────────────────────────────

  describe("Error Handling", () => {
    it("should not navigate when axios.get rejects", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      useSearch.mockReturnValue([{ keyword: "fail" }, mockSetValues]);
      axios.get.mockRejectedValueOnce(new Error("Network error"));

      render(
        <MemoryRouter>
          <SearchInput />
        </MemoryRouter>
      );

      // Act
      fireEvent.submit(screen.getByRole("search"));

      // Assert
      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    it("should not call setValues with results when axios.get rejects", async () => {
      //Julius Bryan Reynon Gambe, A0252251R
      // Arrange
      useSearch.mockReturnValue([{ keyword: "fail" }, mockSetValues]);
      axios.get.mockRejectedValueOnce(new Error("Network error"));

      render(
        <MemoryRouter>
          <SearchInput />
        </MemoryRouter>
      );

      // Act
      fireEvent.submit(screen.getByRole("search"));

      // Assert – setValues is only called by onChange, never by error path
      await waitFor(() => {
        expect(mockSetValues).not.toHaveBeenCalled();
      });
    });
  });
});
