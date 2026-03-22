import React from "react";
import { render, waitFor, screen } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import { useAuth } from "../../context/auth";
import Orders from "./Orders";

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

jest.mock("../../components/UserMenu", () => () => (
  <div data-testid="user-menu">UserMenu</div>
));

jest.mock("moment", () => {
  const mockMoment = jest.fn(() => ({
    fromNow: jest.fn(() => "2 hours ago"),
  }));
  return { __esModule: true, default: mockMoment };
});

window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () { },
      removeListener: function () { },
    };
  };

const mockOrders = [
  {
    _id: "order1",
    status: "Not Process",
    buyer: { name: "John Doe" },
    createdAt: "2024-01-01T00:00:00.000Z",
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
    createdAt: "2024-01-02T00:00:00.000Z",
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

describe("Orders (user)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders All Orders heading and UserMenu", async () => {
      //Julius Bryan Reynon Gambe A0252251R
      useAuth.mockReturnValue([{ token: "mock-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: [] });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      expect(screen.getByText("All Orders")).toBeInTheDocument();
      expect(screen.getByTestId("user-menu")).toBeInTheDocument();
    });

    it("passes Your Orders title to Layout", async () => {
      //Julius Bryan Reynon Gambe A0252251R
      useAuth.mockReturnValue([{ token: "mock-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: [] });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      expect(screen.getByTestId("layout").querySelector("title")).toHaveTextContent(
        "Your Orders"
      );
    });

    it("renders table column headers when orders exist", async () => {
      //Julius Bryan Reynon Gambe A0252251R
      useAuth.mockReturnValue([{ token: "mock-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: [mockOrders[0]] });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        const headers = screen.getAllByRole("columnheader");
        const texts = headers.map((h) => h.textContent);
        expect(texts).toEqual(
          expect.arrayContaining(["#", "Status", "Buyer", " date", "Payment", "Quantity"])
        );
      });
    });
  });

  describe("Fetching orders", () => {
    it("calls GET /api/v1/auth/orders when token present", async () => {
      //Julius Bryan Reynon Gambe A0252251R
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
      });
    });

    it("does not fetch when auth is null", async () => {
      //Julius Bryan Reynon Gambe A0252251R
      useAuth.mockReturnValue([null, jest.fn()]);

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).not.toHaveBeenCalled();
      });
    });

    it("does not fetch when auth has no token", async () => {
      //Julius Bryan Reynon Gambe A0252251R
      useAuth.mockReturnValue([{ user: { name: "User" } }, jest.fn()]);

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).not.toHaveBeenCalled();
      });
    });

    it("logs error when fetch fails", async () => {
      //Julius Bryan Reynon Gambe A0252251R
      const logSpy = jest.spyOn(console, "log").mockImplementation(() => { });
      useAuth.mockReturnValue([{ token: "t" }, jest.fn()]);
      axios.get.mockRejectedValueOnce(new Error("network"));

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(logSpy).toHaveBeenCalled();
      });
      logSpy.mockRestore();
    });
  });

  describe("Displaying orders", () => {
    it("shows buyer names, payment status, and relative date", async () => {
      //Julius Bryan Reynon Gambe A0252251R
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
        expect(screen.getAllByText("2 hours ago").length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("Success")).toBeInTheDocument();
        expect(screen.getByText("Failed")).toBeInTheDocument();
      });
    });

    it("shows product name, truncated description, price, and photo URL", async () => {
      //Julius Bryan Reynon Gambe A0252251R
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: [mockOrders[0]] });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("iPhone 15")).toBeInTheDocument();
        expect(
          screen.getByText("Latest iPhone model with great")
        ).toBeInTheDocument();
        expect(screen.getByText("Price : 999")).toBeInTheDocument();
        const img = screen.getByRole("img", { name: "iPhone 15" });
        expect(img).toHaveAttribute("src", "/api/v1/product/product-photo/prod1");
      });
    });

    it("shows quantity as product count", async () => {
      //Julius Bryan Reynon Gambe A0252251R
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({
        data: [
          {
            ...mockOrders[0],
            products: [
              { _id: "a", name: "A", description: "x".repeat(40), price: 1 },
              { _id: "b", name: "B", description: "y".repeat(40), price: 2 },
            ],
          },
        ],
      });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole("cell", { name: "2" })).toBeInTheDocument();
      });
    });

    it("renders no buyer rows when orders empty", async () => {
      //Julius Bryan Reynon Gambe A0252251R
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValueOnce({ data: [] });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });
      expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    });
  });
});
