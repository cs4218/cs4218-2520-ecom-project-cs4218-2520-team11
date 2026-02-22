import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import PrivateRoute from "./Private";

jest.mock("axios");

jest.mock("../../context/auth", () => ({
  __esModule: true,
  useAuth: jest.fn(),
}));

jest.mock("../Spinner", () => ({
  __esModule: true,
  default: () => <div>Spinner</div>,
}));

import { useAuth } from "../../context/auth";

describe("PrivateRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ZYON AARONEL WEE ZHUN WEI, A0277598B
  it("renders the protected route when auth check succeeds", async () => {
    // Arrange
    useAuth.mockReturnValue([{ token: "token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: { ok: true } });

    // Act
    render(
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/private" element={<div>Secret</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByText("Secret")).toBeInTheDocument();
    });
  });

  // ZYON AARONEL WEE ZHUN WEI, A0277598B
  it("renders the spinner when auth check fails", async () => {
    // Arrange
    useAuth.mockReturnValue([{ token: "token" }, jest.fn()]);
    axios.get.mockResolvedValue({ data: { ok: false } });

    // Act
    render(
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/private" element={<div>Secret</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByText("Spinner")).toBeInTheDocument();
    });
  });

  // ZYON AARONEL WEE ZHUN WEI, A0277598B
  it("renders the spinner when no token is present", () => {
    // Arrange
    useAuth.mockReturnValue([{ token: "" }, jest.fn()]);

    // Act
    render(
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/private" element={<div>Secret</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Assert
    expect(axios.get).not.toHaveBeenCalled();
    expect(screen.getByText("Spinner")).toBeInTheDocument();
  });
});
