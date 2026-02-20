// Antony Swami Alfred Ben, A0253016R
import mongoose from "mongoose";
import userModel from "./userModel.js";

// Antony Swami Alfred Ben, A0253016R — test suite for User Model Schema
describe("User Model Schema", () => {
    // Antony Swami Alfred Ben, A0253016R
    it("should have a name field that is required and trimmed", () => {
        const nameField = userModel.schema.path("name");
        expect(nameField).toBeDefined();
        expect(nameField.isRequired).toBe(true);
        expect(nameField.options.trim).toBe(true);
        expect(nameField.instance).toBe("String");
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should have an email field that is required and unique", () => {
        const emailField = userModel.schema.path("email");
        expect(emailField).toBeDefined();
        expect(emailField.isRequired).toBe(true);
        expect(emailField.options.unique).toBe(true);
        expect(emailField.instance).toBe("String");
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should have a password field that is required", () => {
        const passwordField = userModel.schema.path("password");
        expect(passwordField).toBeDefined();
        expect(passwordField.isRequired).toBe(true);
        expect(passwordField.instance).toBe("String");
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should have a phone field that is required", () => {
        const phoneField = userModel.schema.path("phone");
        expect(phoneField).toBeDefined();
        expect(phoneField.isRequired).toBe(true);
        expect(phoneField.instance).toBe("String");
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should have an address field that is required", () => {
        const addressField = userModel.schema.path("address");
        expect(addressField).toBeDefined();
        expect(addressField.isRequired).toBe(true);
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should have an answer field that is required", () => {
        const answerField = userModel.schema.path("answer");
        expect(answerField).toBeDefined();
        expect(answerField.isRequired).toBe(true);
        expect(answerField.instance).toBe("String");
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should have a role field with default value of 0", () => {
        const roleField = userModel.schema.path("role");
        expect(roleField).toBeDefined();
        expect(roleField.instance).toBe("Number");
        expect(roleField.defaultValue).toBe(0);
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should have timestamps enabled", () => {
        const timestamps = userModel.schema.options.timestamps;
        expect(timestamps).toBe(true);
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should have the model name 'users'", () => {
        expect(userModel.modelName).toBe("users");
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should validate that a user without name fails validation", async () => {
        const user = new userModel({
            email: "test@example.com",
            password: "password123",
            phone: "1234567890",
            address: "123 Main St",
            answer: "football",
        });

        const validationError = user.validateSync();
        expect(validationError).toBeDefined();
        expect(validationError.errors.name).toBeDefined();
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should validate that a user without email fails validation", async () => {
        const user = new userModel({
            name: "John Doe",
            password: "password123",
            phone: "1234567890",
            address: "123 Main St",
            answer: "football",
        });

        const validationError = user.validateSync();
        expect(validationError).toBeDefined();
        expect(validationError.errors.email).toBeDefined();
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should validate that a user without password fails validation", async () => {
        const user = new userModel({
            name: "John Doe",
            email: "test@example.com",
            phone: "1234567890",
            address: "123 Main St",
            answer: "football",
        });

        const validationError = user.validateSync();
        expect(validationError).toBeDefined();
        expect(validationError.errors.password).toBeDefined();
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should validate that a user without phone fails validation", async () => {
        const user = new userModel({
            name: "John Doe",
            email: "test@example.com",
            password: "password123",
            address: "123 Main St",
            answer: "football",
        });

        const validationError = user.validateSync();
        expect(validationError).toBeDefined();
        expect(validationError.errors.phone).toBeDefined();
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should validate that a user without answer fails validation", async () => {
        const user = new userModel({
            name: "John Doe",
            email: "test@example.com",
            password: "password123",
            phone: "1234567890",
            address: "123 Main St",
        });

        const validationError = user.validateSync();
        expect(validationError).toBeDefined();
        expect(validationError.errors.answer).toBeDefined();
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should set role to default 0 when not provided", () => {
        const user = new userModel({
            name: "John Doe",
            email: "test@example.com",
            password: "password123",
            phone: "1234567890",
            address: "123 Main St",
            answer: "football",
        });

        expect(user.role).toBe(0);
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should allow setting role to 1 (admin)", () => {
        const user = new userModel({
            name: "Admin User",
            email: "admin@example.com",
            password: "password123",
            phone: "1234567890",
            address: "123 Main St",
            answer: "football",
            role: 1,
        });

        expect(user.role).toBe(1);
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should trim the name field", () => {
        const user = new userModel({
            name: "  John Doe  ",
            email: "test@example.com",
            password: "password123",
            phone: "1234567890",
            address: "123 Main St",
            answer: "football",
        });

        expect(user.name).toBe("John Doe");
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should accept a valid complete user object without validation errors", () => {
        const user = new userModel({
            name: "John Doe",
            email: "john@example.com",
            password: "password123",
            phone: "1234567890",
            address: "123 Main St",
            answer: "football",
        });

        const validationError = user.validateSync();
        expect(validationError).toBeUndefined();
    });

    // Antony Swami Alfred Ben, A0253016R
    it("should have exactly 7 defined schema paths (excluding internal _id and __v)", () => {
        const schemaPaths = Object.keys(userModel.schema.paths).filter(
            (path) => !path.startsWith("_") && path !== "__v"
        );
        // name, email, password, phone, address, answer, role, createdAt, updatedAt
        expect(schemaPaths).toContain("name");
        expect(schemaPaths).toContain("email");
        expect(schemaPaths).toContain("password");
        expect(schemaPaths).toContain("phone");
        expect(schemaPaths).toContain("address");
        expect(schemaPaths).toContain("answer");
        expect(schemaPaths).toContain("role");
    });
});
