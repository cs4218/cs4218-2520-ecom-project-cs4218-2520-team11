import {
  registerController,
  loginController,
  forgotPasswordController,
  testController,
  updateProfileController
} from "./authController.js";
import userModel from "../models/userModel.js";
import { hashPassword, comparePassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";

jest.mock("../models/userModel.js");
jest.mock("../helpers/authHelper.js");
jest.mock("jsonwebtoken");

describe("Auth Controller Test Suite", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("registerController", () => {

    describe("Input Validation (Negative Testing)", () => {
      it("should return 400 if Name is missing", async () => {
        // Huang Yi Chee, A0259617R
        req.body = {
          email: "test@test.com",
          password: "123",
          phone: "1",
          address: "A",
          answer: "B",
          DOB: "2000-01-01"
        };
        await registerController(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ message: "Name is Required" });
      });

      it("should return 400 if Email is missing", async () => {
        // Huang Yi Chee, A0259617R
        req.body = {
          name: "Test",
          password: "123",
          phone: "1",
          address: "A",
          answer: "B",
          DOB: "2000-01-01"
        };
        await registerController(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ message: "Email is Required" });
      });

      it("should return 400 if Password is missing", async () => {
        // Huang Yi Chee, A0259617R
        req.body = {
          name: "Test",
          email: "test@test.com",
          phone: "1",
          address: "A",
          answer: "B",
          DOB: "2000-01-01"
        };
        await registerController(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ message: "Password is Required" });
      });

      it("should return 400 if Phone is missing", async () => {
        // Huang Yi Chee, A0259617R
        req.body = {
          name: "Test",
          email: "test@test.com",
          password: "123",
          address: "A",
          answer: "B",
          DOB: "2000-01-01"
        };
        await registerController(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ message: "Phone no is Required" });
      });

      it("should return 400 if Address is missing", async () => {
        // Huang Yi Chee, A0259617R
        req.body = {
          name: "Test",
          email: "t@t.com",
          password: "1",
          phone: "1",
          answer: "B",
          DOB: "2000-01-01"
        };
        await registerController(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ message: "Address is Required" });
      });

      it("should return 400 if Answer is missing", async () => {
        // Huang Yi Chee, A0259617R
        req.body = {
          name: "Test",
          email: "t@t.com",
          password: "1",
          phone: "1",
          address: "A",
          DOB: "2000-01-01"
        };
        await registerController(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ message: "Answer is Required" });
      });

      it("should return 400 if DOB is missing", async () => {
        // Huang Yi Chee, A0259617R
        req.body = {
          name: "Test",
          email: "t@t.com",
          password: "1",
          phone: "1",
          address: "A",
          answer: "B"
        };
        await registerController(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ message: "DOB is Required" });
      });
    });

    describe("Business Logic (Positive/Duplicate Testing)", () => {
      it("should return 409 if user already exists", async () => {
        // Huang Yi Chee, A0259617R
        req.body = { name: "Test", email: "exist@test.com", password: "123", phone: "1", address: "A", DOB: "2000-01-01", answer: "B" };
        userModel.findOne.mockResolvedValue({ email: "exist@test.com" });

        await registerController(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Already Register please login"
          })
        );
      });

      it("should register user successfully and save ALL fields", async () => {
        // Huang Yi Chee, A0259617R
        req.body = {
          name: "Test",
          email: "new@test.com",
          password: "123",
          phone: "999",
          address: "123 St",
          answer: "Sports",
          DOB: "2000-01-01"
        };

        userModel.findOne.mockResolvedValue(null);
        hashPassword.mockResolvedValue("hashed_secret");
        const mockSave = jest.fn().mockResolvedValue({ success: true });
        userModel.mockImplementation(() => ({ save: mockSave }));

        await registerController(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(userModel).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Test",
            email: "new@test.com",
            DOB: "2000-01-01",
            password: "hashed_secret"
          })
        );
      });
    });

    describe("Error Handling", () => {
      it("should handle registration errors with 500", async () => {
        // Huang Yi Chee, A0259617R
        req.body = { name: "Test", email: "new@test.com", password: "123", phone: "999", address: "123 St", DOB: "2000-01-01", answer: "Sports" };
        userModel.findOne.mockRejectedValue(new Error("DB Error"));
        await registerController(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({ message: "Error in Registration" })
        );
      });
    });
  });

  describe("loginController", () => {
    const validLogin = { email: "test@example.com", password: "123" };

    describe("Input Validation", () => {
      it("should return 400 if credentials missing", async () => {
        // Huang Yi Chee, A0259617R
        req.body = { email: "" };
        await loginController(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({ message: "Invalid email or password" })
        );
      });
    });

    describe("Authentication Logic", () => {
      it("should return 404 if user not found", async () => {
        // Huang Yi Chee, A0259617R
        req.body = validLogin;
        userModel.findOne.mockResolvedValue(null);
        await loginController(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({ message: "Email is not registered" })
        );
      });

      it("should return 401 if password invalid", async () => {
        // Huang Yi Chee, A0259617R
        req.body = validLogin;
        userModel.findOne.mockResolvedValue({ _id: "1", password: "hash" });
        comparePassword.mockResolvedValue(false);

        await loginController(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({ success: false, message: "Invalid Password" })
        );
      });

      it("should return 200 and token on success", async () => {
        // Huang Yi Chee, A0259617R
        req.body = validLogin;
        userModel.findOne.mockResolvedValue({ _id: "1", email: "test@example.com", role: 0 });
        comparePassword.mockResolvedValue(true);
        JWT.sign.mockReturnValue("token123");

        await loginController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            token: "token123",
            user: expect.objectContaining({ email: "test@example.com" })
          })
        );
      });
    });

    describe("Error Handling", () => {
      it("should handle login errors with 500", async () => {
        // Huang Yi Chee, A0259617R
        req.body = validLogin;
        userModel.findOne.mockRejectedValue(new Error("Fail"));
        await loginController(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({ message: "Error in login" })
        );
      });
    });
  });

  describe("forgotPasswordController", () => {
    const resetBody = { email: "t@t.com", answer: "A", newPassword: "P" };

    describe("Input Validation", () => {
      it("should return 400 if Email missing", async () => {
        // Huang Yi Chee, A0259617R
        req.body = { ...resetBody, email: "" };
        await forgotPasswordController(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ message: "Email is required" });
      });

      it("should return 400 if Answer missing", async () => {
        // Huang Yi Chee, A0259617R
        req.body = { ...resetBody, answer: "" };
        await forgotPasswordController(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ message: "Answer is required" });
      });

      it("should return 400 if New Password missing", async () => {
        // Huang Yi Chee, A0259617R
        req.body = { ...resetBody, newPassword: "" };
        await forgotPasswordController(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ message: "New Password is required" });
      });
    });

    describe("Password Reset Logic", () => {
      it("should return 404 if User/Answer incorrect", async () => {
        // Huang Yi Chee, A0259617R
        req.body = resetBody;
        userModel.findOne.mockResolvedValue(null);
        await forgotPasswordController(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({ message: "Wrong Email Or Answer" })
        );
      });

      it("should reset password successfully", async () => {
        // Huang Yi Chee, A0259617R
        req.body = resetBody;
        userModel.findOne.mockResolvedValue({ _id: "123" });
        hashPassword.mockResolvedValue("new_hash");
        userModel.findByIdAndUpdate.mockResolvedValue({});

        await forgotPasswordController(req, res);

        expect(hashPassword).toHaveBeenCalledWith("P");
        expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith("123", { password: "new_hash" });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({ message: "Password Reset Successfully" })
        );
      });
    });

    describe("Error Handling", () => {
      it("should handle errors with 500", async () => {
        // Huang Yi Chee, A0259617R
        req.body = resetBody;
        userModel.findOne.mockRejectedValue(new Error("Fail"));
        await forgotPasswordController(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({ message: "Something went wrong" })
        );
      });
    });
  });

  describe("testController", () => {
    it("should return protected message", () => {
      // Huang Yi Chee, A0259617R
      testController(req, res);
      expect(res.send).toHaveBeenCalledWith("Protected Routes");
    });

    it("should handle errors in catch block", () => {
      // Huang Yi Chee, A0259617R
      res.send.mockImplementationOnce(() => {
        throw new Error("Simulated Crash");
      });

      testController(req, res);

      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(Error) })
      );
    });
  });

  // Antony Swami Alfred Ben, A0253016R
  describe("updateProfileController", () => {
    const existingUser = {
      _id: "user123",
      name: "Old Name",
      email: "old@example.com",
      password: "old_hashed_password",
      phone: "11111111",
      address: "Old Address",
    };

    beforeEach(() => {
      req.user = { _id: "user123" };
      userModel.findById.mockResolvedValue(existingUser);
    });

    describe("Input Validation", () => {
      // Antony Swami Alfred Ben, A0253016R
      it("should return error when password is provided but less than 6 characters", async () => {
        req.body = { password: "short" };

        await updateProfileController(req, res);

        expect(res.json).toHaveBeenCalledWith({
          error: "Password is required and 6 character long",
        });
        expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
      });

      // Antony Swami Alfred Ben, A0253016R
      it("should not hash password when no password is provided", async () => {
        req.body = { name: "New Name" };
        userModel.findByIdAndUpdate.mockResolvedValue({ ...existingUser, name: "New Name" });

        await updateProfileController(req, res);

        expect(hashPassword).not.toHaveBeenCalled();
      });
    });

    describe("Successful Update", () => {
      // Antony Swami Alfred Ben, A0253016R
      it("should update user profile with new name, phone, and address", async () => {
        req.body = { name: "New Name", phone: "99999999", address: "New Address" };
        const updatedUser = { ...existingUser, name: "New Name", phone: "99999999", address: "New Address" };
        userModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

        await updateProfileController(req, res);

        expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
          "user123",
          expect.objectContaining({
            name: "New Name",
            phone: "99999999",
            address: "New Address",
          }),
          { new: true }
        );
        expect(res.status).toHaveBeenCalledWith(200);
      });

      // Antony Swami Alfred Ben, A0253016R
      it("should hash and update password when valid password (≥6 chars) is provided", async () => {
        req.body = { password: "newpassword123" };
        hashPassword.mockResolvedValue("new_hashed_password");
        userModel.findByIdAndUpdate.mockResolvedValue({ ...existingUser, password: "new_hashed_password" });

        await updateProfileController(req, res);

        expect(hashPassword).toHaveBeenCalledWith("newpassword123");
        expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
          "user123",
          expect.objectContaining({
            password: "new_hashed_password",
          }),
          { new: true }
        );
      });

      // Antony Swami Alfred Ben, A0253016R
      it("should fall back to existing user values when fields are not provided", async () => {
        req.body = {};
        userModel.findByIdAndUpdate.mockResolvedValue(existingUser);

        await updateProfileController(req, res);

        expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
          "user123",
          {
            name: "Old Name",
            password: "old_hashed_password",
            phone: "11111111",
            address: "Old Address",
          },
          { new: true }
        );
      });

      // Antony Swami Alfred Ben, A0253016R
      it("should return 200 with success message and updated user", async () => {
        req.body = { name: "Updated" };
        const updatedUser = { ...existingUser, name: "Updated" };
        userModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

        await updateProfileController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "Profile Updated Successfully",
          updatedUser,
        });
      });
    });

    describe("Error Handling", () => {
      // Antony Swami Alfred Ben, A0253016R
      it("should return 400 when findById throws an error", async () => {
        userModel.findById.mockRejectedValue(new Error("DB Error"));
        req.body = { name: "Test" };

        await updateProfileController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Error While Updating Profile",
          })
        );
      });

      // Antony Swami Alfred Ben, A0253016R
      it("should return 400 when findByIdAndUpdate throws an error", async () => {
        req.body = { name: "Test" };
        userModel.findByIdAndUpdate.mockRejectedValue(new Error("Update failed"));

        await updateProfileController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Error While Updating Profile",
          })
        );
      });
    });
  });
});
