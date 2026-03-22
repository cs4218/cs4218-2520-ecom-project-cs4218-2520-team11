import React from "react";
import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import Spinner from "./Spinner";

const RedirectTarget = ({ label }) => {
  const location = useLocation();
  return (
    <div>
      <h1>{label}</h1>
      <p>from: {location.state || "none"}</p>
    </div>
  );
};

const renderSpinnerFlow = (spinnerProps = {}) =>
  render(
    <MemoryRouter initialEntries={["/protected"]}>
      <Routes>
        <Route path="/protected" element={<Spinner {...spinnerProps} />} />
        <Route path="/login" element={<RedirectTarget label="Login Page" />} />
        <Route
          path="/dashboard"
          element={<RedirectTarget label="Dashboard Page" />}
        />
      </Routes>
    </MemoryRouter>
  );

describe("Spinner integration", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  // Zyon Aaronel Wee Zhun Wei, A0277598B
  it("shows the countdown and then redirects to the default login route with state", () => {
    renderSpinnerFlow();

    expect(
      screen.getByRole("heading", { name: /redirecting to you in 3 second/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.getByRole("heading", { name: /login page/i })).toBeInTheDocument();
    expect(screen.getByText("from: /protected")).toBeInTheDocument();
  });

  // Zyon Aaronel Wee Zhun Wei, A0277598B
  it("redirects to a custom route when the path prop is provided", () => {
    renderSpinnerFlow({ path: "dashboard" });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(
      screen.getByRole("heading", { name: /dashboard page/i })
    ).toBeInTheDocument();
    expect(screen.getByText("from: /protected")).toBeInTheDocument();
  });
});
