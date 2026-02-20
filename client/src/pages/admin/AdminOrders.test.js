import React from "react";
import { render, waitFor, fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import { useAuth } from "../../context/auth";
import AdminOrders from "./AdminOrders";

// ─── Module Mocks ────────────────────────────────────────────────────────────

jest.mock("axios");

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
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
  const MockSelect = ({ children, onChange, defaultValue }) => (
    <select
      data-testid="status-select"
      defaultValue={defaultValue}
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

jest.mock("moment", () => {
  const mockMoment = jest.fn(() => ({
    fromNow: jest.fn(() => "2 hours ago"),
  }));
  return { __esModule: true, default: mockMoment };
});

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

const mockOrders = [
  {
    _id: "order1",
    status: "Not Process",
    buyer: { name: "John Doe" },
    createAt: "2024-01-01T00:00:00.000Z",
    payment: { success: true },
    products: [
      {
        _id: "prod1",
        name: "iPhone 15",
        description: "Latest iPhone model with great features",
        price: 999,
      },
    ],
  },
  {
    _id: "order2",
    status: "Processing",
    buyer: { name: "Jane Smith" },
    createAt: "2024-01-02T00:00:00.000Z",
    payment: { success: false },
    products: [
      {
        _id: "prod2",
        name: "MacBook Pro",
        description: "Powerful laptop for professionals everywhere",
        price: 1999,
      },
    ],
  },
];

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("AdminOrders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe("Rendering", () => {
    it("should render the All Orders heading", async () => {
      // Arrange
      useAuth.mockReturnValue([{ token: "mock-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: [] });

      // Act
      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      // Assert
      expect(screen.getByText("All Orders")).toBeInTheDocument();
    });

    it("should render the table column headers when orders are present", async () => {
      // Arrange – headers are rendered per-order row, so we need at least one order
      useAuth.mockReturnValue([{ token: "mock-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: [mockOrders[0]] });

      // Act
      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByText("#")).toBeInTheDocument();
        expect(screen.getByText("Status")).toBeInTheDocument();
        expect(screen.getByText("Buyer")).toBeInTheDocument();
        expect(screen.getByText("Payment")).toBeInTheDocument();
        expect(screen.getByText("Quantity")).toBeInTheDocument();
      });
    });

    it("should render the AdminMenu component", async () => {
      // Arrange
      useAuth.mockReturnValue([{ token: "mock-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: [] });

      // Act
      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      // Assert
      expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
    });
  });

  // ── Fetching Orders ────────────────────────────────────────────────────────

  describe("Fetching Orders", () => {
    it("should fetch orders when auth token is present", async () => {
      // Arrange
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      // Act
      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      // Assert
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
      });
    });

    it("should not fetch orders when auth is null", async () => {
      // Arrange
      useAuth.mockReturnValue([null, jest.fn()]);

      // Act
      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      // Assert
      await waitFor(() => {
        expect(axios.get).not.toHaveBeenCalled();
      });
    });

    it("should not fetch orders when auth has no token", async () => {
      // Arrange
      useAuth.mockReturnValue([{ user: { name: "Admin" } }, jest.fn()]);

      // Act
      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      // Assert
      await waitFor(() => {
        expect(axios.get).not.toHaveBeenCalled();
      });
    });
  });

  // ── Displaying Orders ──────────────────────────────────────────────────────

  describe("Displaying Orders", () => {
    it("should display buyer names for all orders", async () => {
      // Arrange
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      // Act
      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      });
    });

    it("should display Success for paid orders and Failed for unpaid orders", async () => {
      // Arrange
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      // Act
      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Success")).toBeInTheDocument();
        expect(screen.getByText("Failed")).toBeInTheDocument();
      });
    });

    it("should display product details within each order", async () => {
      // Arrange
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: [mockOrders[0]] });

      // Act
      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByText("iPhone 15")).toBeInTheDocument();
        expect(screen.getByText("Price : 999")).toBeInTheDocument();
      });
    });

    it("should display sequential order numbers for each order row", async () => {
      // Arrange
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      // Act
      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      // Assert – order numbers appear as <td> cells; getAllByText is safe here
      await waitFor(() => {
        // Two orders means both numbers are rendered somewhere in the DOM
        const cells = screen.getAllByRole("cell");
        const cellTexts = cells.map((c) => c.textContent);
        expect(cellTexts).toContain("1");
        expect(cellTexts).toContain("2");
      });
    });

    it("should render no order rows when orders list is empty", async () => {
      // Arrange
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: [] });

      // Act
      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      // Assert
      await waitFor(() => {
        expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
        expect(screen.queryByText("Success")).not.toBeInTheDocument();
      });
    });
  });

  // ── Changing Order Status ──────────────────────────────────────────────────

  describe("Changing Order Status", () => {
    it("should call PUT API with orderId and new status when status changes", async () => {
      // Arrange
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: [mockOrders[0]] });
      axios.put.mockResolvedValueOnce({ data: {} });

      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // Act
      const statusSelect = screen.getByTestId("status-select");
      fireEvent.change(statusSelect, { target: { value: "Processing" } });

      // Assert
      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          "/api/v1/auth/order-status/order1",
          { status: "Processing" }
        );
      });
    });

    it("should refetch orders after a status change", async () => {
      // Arrange
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: [mockOrders[0]] });
      axios.put.mockResolvedValueOnce({ data: {} });

      render(
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const callsBefore = axios.get.mock.calls.length;

      // Act
      fireEvent.change(screen.getByTestId("status-select"), {
        target: { value: "Shipped" },
      });

      // Assert
      await waitFor(() => {
        expect(axios.get.mock.calls.length).toBeGreaterThan(callsBefore);
      });
    });
  });
});
