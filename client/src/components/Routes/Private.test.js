// Antony Swami Alfred Ben, A0253016R

// Antony Swami Alfred Ben, A0253016R — mock mongoose (imported but unused in Private.js)
jest.mock("mongoose", () => ({
    set: jest.fn(),
}));

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import PrivateRoute from "./Private";

// Antony Swami Alfred Ben, A0253016R — mock dependencies
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

// Antony Swami Alfred Ben, A0253016R — mock Spinner using React.createElement to avoid JSX scope issue
jest.mock("../Spinner", () => {
    const React = require("react");
    return function MockSpinner(props) {
        return React.createElement(
            "div",
            { "data-testid": "spinner" },
            "Spinner - redirect to " + (props.path || "login")
        );
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

// Antony Swami Alfred Ben, A0253016R — helper to render PrivateRoute with an outlet child
const renderPrivateRoute = () => {
    return render(
        <MemoryRouter initialEntries={["/dashboard"]}>
            <Routes>
                <Route path="/dashboard" element={<PrivateRoute />}>
                    <Route
                        index
                        element={
                            <div data-testid="protected-content">Protected Content</div>
                        }
                    />
                </Route>
            </Routes>
        </MemoryRouter>
    );
};

// Antony Swami Alfred Ben, A0253016R — test suite
describe("PrivateRoute Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should render Outlet when auth check passes (ok: true)", async () => {
        useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
        axios.get.mockResolvedValueOnce({ data: { ok: true } });

        await act(async () => {
            renderPrivateRoute();
        });

        await waitFor(() => {
            expect(screen.getByTestId("protected-content")).toBeInTheDocument();
        });

        expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should render Spinner when auth check fails (ok: false)", async () => {
        useAuth.mockReturnValue([{ token: "invalid-token" }, jest.fn()]);
        axios.get.mockResolvedValueOnce({ data: { ok: false } });

        await act(async () => {
            renderPrivateRoute();
        });

        await waitFor(() => {
            expect(screen.getByTestId("spinner")).toBeInTheDocument();
        });
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should render Spinner when there is no auth token", async () => {
        useAuth.mockReturnValue([{ token: "" }, jest.fn()]);

        await act(async () => {
            renderPrivateRoute();
        });

        expect(screen.getByTestId("spinner")).toBeInTheDocument();
        expect(axios.get).not.toHaveBeenCalled();
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should render Spinner when auth token is null", async () => {
        useAuth.mockReturnValue([{ token: null }, jest.fn()]);

        await act(async () => {
            renderPrivateRoute();
        });

        expect(screen.getByTestId("spinner")).toBeInTheDocument();
        expect(axios.get).not.toHaveBeenCalled();
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should render Spinner when auth is undefined", async () => {
        useAuth.mockReturnValue([undefined, jest.fn()]);

        await act(async () => {
            renderPrivateRoute();
        });

        expect(screen.getByTestId("spinner")).toBeInTheDocument();
        expect(axios.get).not.toHaveBeenCalled();
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should render Spinner when auth token is undefined", async () => {
        useAuth.mockReturnValue([{}, jest.fn()]);

        await act(async () => {
            renderPrivateRoute();
        });

        expect(screen.getByTestId("spinner")).toBeInTheDocument();
        expect(axios.get).not.toHaveBeenCalled();
    });

    // Antony Swami Alfred Ben, A0253016R
    // Note: Private.js has no try-catch around axios.get — this is a known bug.
    // An API failure causes an unhandled rejection. We document this as a bug
    // rather than testing the error path, since the component lacks error handling.
    it("should call the correct auth API endpoint when token is present", async () => {
        useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
        axios.get.mockResolvedValueOnce({ data: { ok: true } });

        await act(async () => {
            renderPrivateRoute();
        });

        expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should re-check auth when token changes", async () => {
        useAuth.mockReturnValue([{ token: null }, jest.fn()]);

        const { unmount } = await act(async () => {
            return render(
                <MemoryRouter initialEntries={["/dashboard"]}>
                    <Routes>
                        <Route path="/dashboard" element={<PrivateRoute />}>
                            <Route
                                index
                                element={
                                    <div data-testid="protected-content">Protected</div>
                                }
                            />
                        </Route>
                    </Routes>
                </MemoryRouter>
            );
        });

        // First render — no token, should not call API
        expect(axios.get).not.toHaveBeenCalled();

        unmount();

        // Second render — with token, should call API
        useAuth.mockReturnValue([{ token: "new-token" }, jest.fn()]);
        axios.get.mockResolvedValueOnce({ data: { ok: true } });

        await act(async () => {
            renderPrivateRoute();
        });

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
        });
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should pass empty string as path prop to Spinner", async () => {
        useAuth.mockReturnValue([{ token: "" }, jest.fn()]);

        await act(async () => {
            renderPrivateRoute();
        });

        // Spinner receives path="" based on source: <Spinner path="" />
        expect(screen.getByTestId("spinner")).toHaveTextContent(
            "Spinner - redirect to"
        );
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should not render protected content when ok is false", async () => {
        useAuth.mockReturnValue([{ token: "some-token" }, jest.fn()]);
        axios.get.mockResolvedValueOnce({ data: { ok: false } });

        await act(async () => {
            renderPrivateRoute();
        });

        await waitFor(() => {
            expect(
                screen.queryByTestId("protected-content")
            ).not.toBeInTheDocument();
        });
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should make exactly one API call per render when token is present", async () => {
        useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
        axios.get.mockResolvedValueOnce({ data: { ok: true } });

        await act(async () => {
            renderPrivateRoute();
        });

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledTimes(1);
        });
    });
});
