import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { AuthProvider, useAuth } from "./auth";
import axios from "axios";

jest.mock("axios", () => ({
  defaults: {
    headers: {
      common: {},
    },
  },
}));

const DummyComponent = () => {
  const [auth, setAuth] = useAuth();
  
  return (
    <div>
      <span data-testid="auth-user">{auth?.user ? auth.user.name : "null"}</span>
      <span data-testid="auth-token">{auth?.token ? auth.token : "empty"}</span>
      <button
        onClick={() => setAuth({ user: { name: "Updated User" }, token: "new_jwt_token" })}
        data-testid="update-btn"
      >
        Update Auth
      </button>
    </div>
  );
};

describe("Auth Context & Provider - Strict Test Suite", () => {
  
  beforeEach(() => {
    window.localStorage.clear();
    axios.defaults.headers.common["Authorization"] = undefined;
    jest.clearAllMocks();
  });

  describe("Control Flow Graph (CFG): Initial Mount & Hydration", () => {
    
    it("Path 1: should initialize with default state when localStorage is empty", () => {
      // Huang Yi Chee, A0259617R
      render(
        <AuthProvider>
          <DummyComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId("auth-user").textContent).toBe("null");
      expect(screen.getByTestId("auth-token").textContent).toBe("empty");
      expect(axios.defaults.headers.common["Authorization"]).toBe("");
    });

    it("Path 2: should hydrate state from localStorage if data exists", async () => {
      // Huang Yi Chee, A0259617R
      const mockAuthData = {
        user: { name: "Hydrated User" },
        token: "existing_localstorage_token",
      };
      window.localStorage.setItem("auth", JSON.stringify(mockAuthData));

      render(
        <AuthProvider>
          <DummyComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("auth-user").textContent).toBe("Hydrated User");
        expect(screen.getByTestId("auth-token").textContent).toBe("existing_localstorage_token");
      });

      expect(axios.defaults.headers.common["Authorization"]).toBe("existing_localstorage_token");
    });
  });

  describe("State Modification", () => {
    
    it("should allow consumers to manually update the auth state via setAuth", async () => {
      // Huang Yi Chee, A0259617R
      render(
        <AuthProvider>
          <DummyComponent />
        </AuthProvider>
      );

      fireEvent.click(screen.getByTestId("update-btn"));

      await waitFor(() => {
        expect(screen.getByTestId("auth-user").textContent).toBe("Updated User");
        expect(screen.getByTestId("auth-token").textContent).toBe("new_jwt_token");
      });
      
      expect(axios.defaults.headers.common["Authorization"]).toBe("new_jwt_token");
    });
  });
});