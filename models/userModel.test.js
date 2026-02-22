import User from "./userModel.js";

describe("userModel", () => {
  // ZYON AARONEL WEE ZHUN WEI, A0277598B
  it("requires the mandatory fields", () => {
    // Arrange
    const user = new User({});

    // Act
    const error = user.validateSync();

    // Assert
    expect(error).toBeDefined();
    expect(error.errors).toHaveProperty("name");
    expect(error.errors).toHaveProperty("email");
    expect(error.errors).toHaveProperty("password");
    expect(error.errors).toHaveProperty("phone");
    expect(error.errors).toHaveProperty("address");
    expect(error.errors).toHaveProperty("answer");
  });

  // ZYON AARONEL WEE ZHUN WEI, A0277598B
  it("defaults role to 0 when not provided", () => {
    // Arrange
    const user = new User({
      name: "Jane",
      email: "jane@example.com",
      password: "pass123",
      phone: "12345678",
      address: "123 Street",
      answer: "blue",
    });

    // Act
    const role = user.role;

    // Assert
    expect(role).toBe(0);
  });
});
