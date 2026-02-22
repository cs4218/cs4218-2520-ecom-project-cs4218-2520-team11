import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import useCategory from "./useCategory";

jest.mock("axios");

const TestComponent = () => {
  const categories = useCategory();
  return (
    <ul>
      {categories.map((category) => (
        <li key={category._id}>{category.name}</li>
      ))}
    </ul>
  );
};

describe("useCategory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ZYON AARONEL WEE ZHUN WEI, A0277598B
  it("renders categories after a successful fetch", async () => {
    // Arrange
    axios.get.mockResolvedValue({
      data: { category: [{ _id: "1", name: "Phones" }] },
    });

    // Act
    render(<TestComponent />);

    // Assert
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      expect(screen.getByText("Phones")).toBeInTheDocument();
    });
  });

  // ZYON AARONEL WEE ZHUN WEI, A0277598B
  it("keeps categories empty when the fetch fails", async () => {
    // Arrange
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get.mockRejectedValue(new Error("network error"));

    // Act
    render(<TestComponent />);

    // Assert
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    });
    logSpy.mockRestore();
  });
});
