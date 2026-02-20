import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { MemoryRouter } from "react-router-dom";
import Users from "./Users";

// ─── Module Mocks ────────────────────────────────────────────────────────────

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

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("Users", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe("Rendering", () => {
    it("should render the All Users heading", () => {
      // Arrange & Act
      render(
        <MemoryRouter>
          <Users />
        </MemoryRouter>
      );

      // Assert
      expect(screen.getByText("All Users")).toBeInTheDocument();
    });

    it("should render the Layout component with the correct title", () => {
      // Arrange & Act
      render(
        <MemoryRouter>
          <Users />
        </MemoryRouter>
      );

      // Assert
      expect(screen.getByTestId("layout")).toBeInTheDocument();
      expect(document.querySelector("title").textContent).toBe(
        "Dashboard - All Users"
      );
    });

    it("should render the AdminMenu component", () => {
      // Arrange & Act
      render(
        <MemoryRouter>
          <Users />
        </MemoryRouter>
      );

      // Assert
      expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
    });

    it("should render AdminMenu and All Users heading in the same view", () => {
      // Arrange & Act
      render(
        <MemoryRouter>
          <Users />
        </MemoryRouter>
      );

      // Assert - both main UI elements are present simultaneously
      expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
      expect(screen.getByText("All Users")).toBeInTheDocument();
    });
  });
});
