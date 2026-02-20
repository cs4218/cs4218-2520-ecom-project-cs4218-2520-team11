// Antony Swami Alfred Ben, A0253016R
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import UserMenu from "./UserMenu";

// Antony Swami Alfred Ben, A0253016R — mock dependencies
jest.mock("../context/auth", () => ({
    useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../context/cart", () => ({
    useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../context/search", () => ({
    useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

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

// Antony Swami Alfred Ben, A0253016R — test suite
describe("UserMenu Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should render the Dashboard heading", () => {
        render(
            <MemoryRouter>
                <UserMenu />
            </MemoryRouter>
        );

        expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should render the Profile navigation link", () => {
        render(
            <MemoryRouter>
                <UserMenu />
            </MemoryRouter>
        );

        expect(screen.getByText("Profile")).toBeInTheDocument();
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should render the Orders navigation link", () => {
        render(
            <MemoryRouter>
                <UserMenu />
            </MemoryRouter>
        );

        expect(screen.getByText("Orders")).toBeInTheDocument();
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should have Profile link pointing to /dashboard/user/profile", () => {
        render(
            <MemoryRouter>
                <UserMenu />
            </MemoryRouter>
        );

        const profileLink = screen.getByText("Profile");
        expect(profileLink.closest("a")).toHaveAttribute(
            "href",
            "/dashboard/user/profile"
        );
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should have Orders link pointing to /dashboard/user/orders", () => {
        render(
            <MemoryRouter>
                <UserMenu />
            </MemoryRouter>
        );

        const ordersLink = screen.getByText("Orders");
        expect(ordersLink.closest("a")).toHaveAttribute(
            "href",
            "/dashboard/user/orders"
        );
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should render links with list-group-item class", () => {
        render(
            <MemoryRouter>
                <UserMenu />
            </MemoryRouter>
        );

        const profileLink = screen.getByText("Profile").closest("a");
        const ordersLink = screen.getByText("Orders").closest("a");

        expect(profileLink).toHaveClass("list-group-item");
        expect(profileLink).toHaveClass("list-group-item-action");
        expect(ordersLink).toHaveClass("list-group-item");
        expect(ordersLink).toHaveClass("list-group-item-action");
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should render exactly two navigation links", () => {
        render(
            <MemoryRouter>
                <UserMenu />
            </MemoryRouter>
        );

        const links = screen.getAllByRole("link");
        expect(links).toHaveLength(2);
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should render within a list-group container", () => {
        render(
            <MemoryRouter>
                <UserMenu />
            </MemoryRouter>
        );

        const listGroup = document.querySelector(".list-group");
        expect(listGroup).toBeInTheDocument();
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should render Dashboard heading as an h4 element", () => {
        render(
            <MemoryRouter>
                <UserMenu />
            </MemoryRouter>
        );

        const heading = screen.getByText("Dashboard");
        expect(heading.tagName).toBe("H4");
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should have text-center class on the wrapper", () => {
        render(
            <MemoryRouter>
                <UserMenu />
            </MemoryRouter>
        );

        const textCenterDiv = document.querySelector(".text-center");
        expect(textCenterDiv).toBeInTheDocument();
    });
});
