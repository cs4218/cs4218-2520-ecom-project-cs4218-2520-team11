import { hashPassword, comparePassword } from "./authHelper.js";
import bcrypt from "bcrypt";

// mock external bcrypt library
jest.mock("bcrypt");

describe("Auth Helper - Strict Cryptography Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("hashPassword", () => {
    
    describe("Hashing Logic", () => {
      it("should successfully hash a plain text password with 10 salt rounds", async () => {
        const plainPassword = "mySecurePassword";
        bcrypt.hash.mockResolvedValue("mocked_hashed_string");

        const result = await hashPassword(plainPassword);

        expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, 10);
        expect(result).toBe("mocked_hashed_string");
      });
    });

    describe("Error Handling", () => {
      it("should THROW an error if bcrypt fails (Strict Security Check)", async () => {
        const dbError = new Error("Bcrypt hashing failed");
        bcrypt.hash.mockRejectedValue(dbError);
        await expect(hashPassword("password123")).rejects.toThrow("Bcrypt hashing failed");
      });
    });
  });
    
  describe("comparePassword", () => {
    
    describe("Comparison Logic", () => {
      it("should return true when passwords match", async () => {
        bcrypt.compare.mockResolvedValue(true);

        const result = await comparePassword("plainText", "hashedText");

        expect(bcrypt.compare).toHaveBeenCalledWith("plainText", "hashedText");
        expect(result).toBe(true);
      });

      it("should return false when passwords do not match", async () => {
        bcrypt.compare.mockResolvedValue(false);

        const result = await comparePassword("wrongPassword", "hashedText");

        expect(bcrypt.compare).toHaveBeenCalledWith("wrongPassword", "hashedText");
        expect(result).toBe(false);
      });
    });
  });
});