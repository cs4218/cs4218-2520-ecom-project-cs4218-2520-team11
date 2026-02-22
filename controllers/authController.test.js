import { 
  registerController, 
  loginController, 
  forgotPasswordController, 
  testController 
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
});
