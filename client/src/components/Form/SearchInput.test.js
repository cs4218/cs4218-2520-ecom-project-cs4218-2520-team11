// Antony Swami Alfred Ben, A0253016R
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import SearchInput from "./SearchInput";

// Antony Swami Alfred Ben, A0253016R — mock dependencies
jest.mock("axios");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
}));

const mockSetValues = jest.fn();
let mockValues = { keyword: "", results: [] };

jest.mock("../../context/auth", () => ({
    useAuth: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../context/cart", () => ({
    useCart: jest.fn(() => [null, jest.fn()]),
}));

// Antony Swami Alfred Ben, A0253016R — mock search context
jest.mock("../../context/search", () => ({
    useSearch: jest.fn(() => [mockValues, mockSetValues]),
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

const { useSearch } = require("../../context/search");

// Antony Swami Alfred Ben, A0253016R — test suite
describe("SearchInput Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockValues = { keyword: "", results: [] };
        useSearch.mockReturnValue([mockValues, mockSetValues]);
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should render a search input field", () => {
        render(
            <MemoryRouter>
                <SearchInput />
            </MemoryRouter>
        );

        expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should render a Search button", () => {
        render(
            <MemoryRouter>
                <SearchInput />
            </MemoryRouter>
        );

        expect(screen.getByText("Search")).toBeInTheDocument();
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should render a form with role='search'", () => {
        render(
            <MemoryRouter>
                <SearchInput />
            </MemoryRouter>
        );

        expect(screen.getByRole("search")).toBeInTheDocument();
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should display the current keyword value from search context", () => {
        useSearch.mockReturnValue([
            { keyword: "laptop", results: [] },
            mockSetValues,
        ]);

        render(
            <MemoryRouter>
                <SearchInput />
            </MemoryRouter>
        );

        expect(screen.getByPlaceholderText("Search")).toHaveValue("laptop");
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should call setValues when typing in the input field", () => {
        render(
            <MemoryRouter>
                <SearchInput />
            </MemoryRouter>
        );

        const input = screen.getByPlaceholderText("Search");
        fireEvent.change(input, { target: { value: "phone" } });

        expect(mockSetValues).toHaveBeenCalledWith({
            keyword: "phone",
            results: [],
        });
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should call axios.get with correct URL on form submit", async () => {
        useSearch.mockReturnValue([
            { keyword: "laptop", results: [] },
            mockSetValues,
        ]);

        const mockData = [{ _id: "1", name: "Laptop", price: 999 }];
        axios.get.mockResolvedValueOnce({ data: mockData });

        render(
            <MemoryRouter>
                <SearchInput />
            </MemoryRouter>
        );

        const form = screen.getByRole("search");
        fireEvent.submit(form);

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/laptop");
        });
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should update search context with results after successful search", async () => {
        useSearch.mockReturnValue([
            { keyword: "laptop", results: [] },
            mockSetValues,
        ]);

        const mockData = [
            { _id: "1", name: "Laptop", price: 999 },
            { _id: "2", name: "Gaming Laptop", price: 1499 },
        ];
        axios.get.mockResolvedValueOnce({ data: mockData });

        render(
            <MemoryRouter>
                <SearchInput />
            </MemoryRouter>
        );

        const form = screen.getByRole("search");
        fireEvent.submit(form);

        await waitFor(() => {
            expect(mockSetValues).toHaveBeenCalledWith({
                keyword: "laptop",
                results: mockData,
            });
        });
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should navigate to /search after successful search", async () => {
        useSearch.mockReturnValue([
            { keyword: "laptop", results: [] },
            mockSetValues,
        ]);

        axios.get.mockResolvedValueOnce({ data: [] });

        render(
            <MemoryRouter>
                <SearchInput />
            </MemoryRouter>
        );

        const form = screen.getByRole("search");
        fireEvent.submit(form);

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/search");
        });
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should not navigate when API call fails", async () => {
        useSearch.mockReturnValue([
            { keyword: "laptop", results: [] },
            mockSetValues,
        ]);

        axios.get.mockRejectedValueOnce(new Error("Network error"));

        // Spy on console.log to verify error logging
        const consoleSpy = jest.spyOn(console, "log").mockImplementation();

        render(
            <MemoryRouter>
                <SearchInput />
            </MemoryRouter>
        );

        const form = screen.getByRole("search");
        fireEvent.submit(form);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled();
        });

        expect(mockNavigate).not.toHaveBeenCalled();

        consoleSpy.mockRestore();
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should have input of type search", () => {
        render(
            <MemoryRouter>
                <SearchInput />
            </MemoryRouter>
        );

        const input = screen.getByPlaceholderText("Search");
        expect(input).toHaveAttribute("type", "search");
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should have the Search button with correct CSS class", () => {
        render(
            <MemoryRouter>
                <SearchInput />
            </MemoryRouter>
        );

        const button = screen.getByText("Search");
        expect(button).toHaveClass("btn");
        expect(button).toHaveClass("btn-outline-success");
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should have the Search button of type submit", () => {
        render(
            <MemoryRouter>
                <SearchInput />
            </MemoryRouter>
        );

        const button = screen.getByText("Search");
        expect(button).toHaveAttribute("type", "submit");
    });
});
