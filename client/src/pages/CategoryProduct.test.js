//Attribution : This file is prepared with the help of DeepSeek-V3.2

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import CategoryProduct from "./CategoryProduct";

// Mock dependencies
jest.mock("../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock("axios");

describe("CategoryProduct Component", () => {
  const mockNavigate = jest.fn();
  const mockUseParams = require("react-router-dom").useParams;
  const mockUseNavigate = require("react-router-dom").useNavigate;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ slug: "electronics" });
    mockUseNavigate.mockReturnValue(mockNavigate);
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <CategoryProduct />
      </BrowserRouter>
    );
  };

  // TEST 1: Successful data fetch and display
  test("fetches and displays products successfully", async () => {
    const mockResponse = {
      data: {
        category: { name: "Electronics" },
        products: [
          {
            _id: "1",
            name: "Laptop",
            price: 999.99,
            description: "High performance laptop",
            slug: "laptop-pro"
          }
        ]
      }
    };

    axios.get.mockResolvedValueOnce(mockResponse);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Category - Electronics")).toBeInTheDocument();
      expect(screen.getByText("1 result found")).toBeInTheDocument();
      expect(screen.getByText("Laptop")).toBeInTheDocument();
      expect(screen.getByText("$999.99")).toBeInTheDocument();
    });
  });

  // TEST 2: Empty products array
  test("handles empty product list correctly", async () => {
    const mockResponse = {
      data: {
        category: { name: "Empty Category" },
        products: []
      }
    };

    axios.get.mockResolvedValueOnce(mockResponse);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Category - Empty Category")).toBeInTheDocument();
      expect(screen.getByText("0 result found")).toBeInTheDocument();
    });

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  // TEST 3: API error handling
  test("handles API error gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();
    const error = new Error("Network error");
    axios.get.mockRejectedValueOnce(error);

    renderComponent();

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(error);
    });

    consoleSpy.mockRestore();
  });

  // TEST 4: Navigation to product details
  test("navigates to product details when More Details button is clicked", async () => {
    const mockResponse = {
      data: {
        category: { name: "Electronics" },
        products: [
          {
            _id: "1",
            name: "Tablet",
            price: 499.99,
            description: "Portable tablet",
            slug: "tablet-pro"
          }
        ]
      }
    };

    axios.get.mockResolvedValueOnce(mockResponse);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Tablet")).toBeInTheDocument();
    });

    const moreDetailsButton = screen.getByText("More Details");
    moreDetailsButton.click();

    expect(mockNavigate).toHaveBeenCalledWith("/product/tablet-pro");
  });

  // TEST 5: API called with correct slug
  test("calls API with correct slug parameter", async () => {
    mockUseParams.mockReturnValue({ slug: "electronics" });
    
    axios.get.mockResolvedValueOnce({
      data: { category: { name: "Electronics" }, products: [] }
    });

    renderComponent();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/product-category/electronics"
      );
    });
  });
});