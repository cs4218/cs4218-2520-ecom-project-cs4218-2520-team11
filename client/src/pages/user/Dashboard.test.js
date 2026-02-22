import React from "react";
import { render, screen } from "@testing-library/react";
import Dashboard from "./Dashboard";

jest.mock("../../context/auth", () => ({
  __esModule: true,
  useAuth: jest.fn(),
}));

jest.mock("../../components/Layout", () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock("../../components/UserMenu", () => ({
  __esModule: true,
  default: () => <div>User Menu</div>,
}));

import { useAuth } from "../../context/auth";

describe("User Dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ZYON AARONEL WEE ZHUN WEI, A0277598B
  it("renders user details from auth context", () => {
    // Arrange
    useAuth.mockReturnValue([
      { user: { name: "Jane", email: "jane@example.com", address: "Main St" } },
    ]);

    // Act
    render(<Dashboard />);

    // Assert
    expect(screen.getByText("Jane")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    expect(screen.getByText("Main St")).toBeInTheDocument();
  });
});
