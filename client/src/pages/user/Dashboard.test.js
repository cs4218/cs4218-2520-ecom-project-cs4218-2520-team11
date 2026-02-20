// Antony Swami Alfred Ben, A0253016R
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import Dashboard from "./Dashboard";

// Antony Swami Alfred Ben, A0253016R — mock dependencies
jest.mock("../../context/auth", () => ({
    useAuth: jest.fn(),
}));

jest.mock("../../context/cart", () => ({
    useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/search", () => ({
    useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

// Antony Swami Alfred Ben, A0253016R — mock Layout to simplify testing
jest.mock("../../components/Layout", () => {
    return function MockLayout({ children, title }) {
        return (
            <div data-testid="layout" data-title={title}>
                {children}
            </div>
        );
    };
});

// Antony Swami Alfred Ben, A0253016R — mock UserMenu
jest.mock("../../components/UserMenu", () => {
    return function MockUserMenu() {
        return <div data-testid="user-menu">UserMenu</div>;
    };
});

Object.defineProperty(window, "localStorage", {
    value: {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn(),
    },
    writable: true,
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

const { useAuth } = require("../../context/auth");

// Antony Swami Alfred Ben, A0253016R — test suite
describe("Dashboard Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockUser = {
        name: "John Doe",
        email: "john@example.com",
        address: "123 Main Street",
        phone: "1234567890",
    };

    // Antony Swami Alfred Ben, A0253016R
    it("should render the user's name", () => {
        useAuth.mockReturnValue([{ user: mockUser, token: "test-token" }]);

        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        );

        expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should render the user's email", () => {
        useAuth.mockReturnValue([{ user: mockUser, token: "test-token" }]);

        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        );

        expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should render the user's address", () => {
        useAuth.mockReturnValue([{ user: mockUser, token: "test-token" }]);

        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        );

        expect(screen.getByText("123 Main Street")).toBeInTheDocument();
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should render Layout with correct title", () => {
        useAuth.mockReturnValue([{ user: mockUser, token: "test-token" }]);

        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        );

        const layout = screen.getByTestId("layout");
        expect(layout).toHaveAttribute("data-title", "Dashboard - Ecommerce App");
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should render the UserMenu component", () => {
        useAuth.mockReturnValue([{ user: mockUser, token: "test-token" }]);

        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        );

        expect(screen.getByTestId("user-menu")).toBeInTheDocument();
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should handle missing user gracefully (auth.user is undefined)", () => {
        useAuth.mockReturnValue([{ user: undefined, token: "" }]);

        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        );

        // Should render without crashing — optional chaining handles undefined
        expect(screen.getByTestId("layout")).toBeInTheDocument();
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should handle null user gracefully", () => {
        useAuth.mockReturnValue([{ user: null, token: "" }]);

        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        );

        expect(screen.getByTestId("layout")).toBeInTheDocument();
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should handle user with empty string fields", () => {
        useAuth.mockReturnValue([
            { user: { name: "", email: "", address: "" }, token: "test-token" },
        ]);

        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        );

        // Empty strings shouldn't cause errors — card should still render
        const card = document.querySelector(".card");
        expect(card).toBeInTheDocument();
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should render all three user fields in h3 tags", () => {
        useAuth.mockReturnValue([{ user: mockUser, token: "test-token" }]);

        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        );

        const h3Elements = document.querySelectorAll("h3");
        expect(h3Elements.length).toBe(3);
        expect(h3Elements[0]).toHaveTextContent("John Doe");
        expect(h3Elements[1]).toHaveTextContent("john@example.com");
        expect(h3Elements[2]).toHaveTextContent("123 Main Street");
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should have the correct dashboard class structure", () => {
        useAuth.mockReturnValue([{ user: mockUser, token: "test-token" }]);

        render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        );

        const dashboardDiv = document.querySelector(".dashboard");
        expect(dashboardDiv).toBeInTheDocument();
    });
});
