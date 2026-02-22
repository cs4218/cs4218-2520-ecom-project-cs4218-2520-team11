import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ForgotPassword from "./ForgotPassword";
import axios from "axios";
import toast from "react-hot-toast";
import { MemoryRouter, Routes, Route } from "react-router-dom";

jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" title={title}>{children}</div>
));

describe("ForgotPassword Component UI Test Suite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // helper function to render the component inside a MemoryRouter so the useNavigate hook can be tested
  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={["/forgot-password"]}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/login" element={<div>Virtual Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe("UI Rendering", () => {
      it("should mount the form with all required inputs", () => {
      // Huang Yi Chee, A0259617R
      renderComponent();

      expect(screen.getByPlaceholderText(/Enter Your Email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Enter Your Secret Answer/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Enter Your New Password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /RESET PASSWORD/i })).toBeInTheDocument();
    });

    it("should allow users to type into the input fields", () => {
    // Huang Yi Chee, A0259617R
      renderComponent();
      
      const emailInput = screen.getByPlaceholderText(/Enter Your Email/i);
      const answerInput = screen.getByPlaceholderText(/Enter Your Secret Answer/i);
      const passwordInput = screen.getByPlaceholderText(/Enter Your New Password/i);

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(answerInput, { target: { value: "Sports" } });
      fireEvent.change(passwordInput, { target: { value: "newSecurePassword123" } });
      
      expect(emailInput.value).toBe("test@example.com");
      expect(answerInput.value).toBe("Sports");
      expect(passwordInput.value).toBe("newSecurePassword123");
    });
  });

  describe("API Submission and Navigation", () => {
    it("should handle successful password reset, show toast, and navigate to login", async () => {
    // Huang Yi Chee, A0259617R
      axios.post.mockResolvedValue({
        data: { success: true, message: "Password Reset Successfully" },
      });

      renderComponent();

      fireEvent.change(screen.getByPlaceholderText(/Enter Your Email/i), { target: { value: "test@example.com" } });
      fireEvent.change(screen.getByPlaceholderText(/Enter Your Secret Answer/i), { target: { value: "Sports" } });
      fireEvent.change(screen.getByPlaceholderText(/Enter Your New Password/i), { target: { value: "newPassword123" } });
      fireEvent.click(screen.getByRole("button", { name: /RESET PASSWORD/i }));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
      });

      expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/forgot-password", {
        email: "test@example.com",
        answer: "Sports",
        newPassword: "newPassword123",
      });
      expect(toast.success).toHaveBeenCalledWith("Password Reset Successfully");
      
      expect(await screen.findByText("Virtual Login Page")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should display error toast if API returns success: false (Wrong Answer)", async () => {
    // Huang Yi Chee, A0259617R
      axios.post.mockResolvedValue({
        data: { success: false, message: "Wrong Email Or Answer" },
      });

      renderComponent();

      fireEvent.change(screen.getByPlaceholderText(/Enter Your Email/i), { target: { value: "test@example.com" } });
      fireEvent.change(screen.getByPlaceholderText(/Enter Your Secret Answer/i), { target: { value: "Wrong" } });
      fireEvent.change(screen.getByPlaceholderText(/Enter Your New Password/i), { target: { value: "newPassword123" } });
      fireEvent.click(screen.getByRole("button", { name: /RESET PASSWORD/i }));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
      });

      expect(toast.error).toHaveBeenCalledWith("Wrong Email Or Answer");
      expect(screen.queryByText("Virtual Login Page")).not.toBeInTheDocument();
    });

    it("should display generic error toast if API call crashes (Catch Block)", async () => {
    // Huang Yi Chee, A0259617R
      axios.post.mockRejectedValue(new Error("Network Error"));

      renderComponent();

      fireEvent.change(screen.getByPlaceholderText(/Enter Your Email/i), { target: { value: "test@example.com" } });
      fireEvent.change(screen.getByPlaceholderText(/Enter Your Secret Answer/i), { target: { value: "Sports" } });
      fireEvent.change(screen.getByPlaceholderText(/Enter Your New Password/i), { target: { value: "newPassword123" } });
      fireEvent.click(screen.getByRole("button", { name: /RESET PASSWORD/i }));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
      });

      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });
});
