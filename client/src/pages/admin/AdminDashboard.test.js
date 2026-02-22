import React from "react";
import { render, screen } from "@testing-library/react";
import AdminDashboard from "./AdminDashboard";

jest.mock("../../context/auth", () => ({
  __esModule: true,
  useAuth: jest.fn(),
}));

jest.mock("../../components/Layout", () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock("../../components/AdminMenu", () => ({
  __esModule: true,
  default: () => <div>Admin Menu</div>,
}));

import { useAuth } from "../../context/auth";

describe("AdminDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ZYON AARONEL WEE ZHUN WEI, A0277598B
  it("renders admin details from auth context", () => {
    // Arrange
    useAuth.mockReturnValue([
      { user: { name: "Admin", email: "admin@example.com", phone: "1234" } },
    ]);

    // Act
    render(<AdminDashboard />);

    // Assert
    expect(screen.getByText(/Admin Name : Admin/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin Email : admin@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin Contact : 1234/i)).toBeInTheDocument();
  });
});
