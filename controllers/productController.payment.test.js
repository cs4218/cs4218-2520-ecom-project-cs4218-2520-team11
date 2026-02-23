import { jest } from "@jest/globals";
import braintree from "braintree";
import {
  braintreeTokenController,
  brainTreePaymentController,
} from "./productController.js";

jest.mock("braintree", () => {
  const mockGenerate = jest.fn();
  const mockSale = jest.fn();
  return {
    mockGenerate,
    mockSale,
    BraintreeGateway: jest.fn().mockImplementation(() => ({
      clientToken: { generate: mockGenerate },
      transaction: { sale: mockSale },
    })),
    Environment: { Sandbox: "sandbox" },
  };
});

jest.mock("../models/orderModel.js", () => {
  return jest.fn().mockImplementation(function (payload) {
    this.save = jest.fn().mockResolvedValue({});
    this.payload = payload;
  });
});

jest.mock("../models/productModel.js", () => jest.fn());
jest.mock("../models/categoryModel.js", () => jest.fn());

const mockGenerate = braintree.mockGenerate;
const mockSale = braintree.mockSale;

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("productController payment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ZYON AARONEL WEE ZHUN WEI, A0277598B
  it("logs error when token generation throws", async () => {
    // Arrange
    const req = {};
    const res = createRes();
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const thrown = new Error("generate failed");
    mockGenerate.mockImplementation(() => {
      throw thrown;
    });

    // Act
    await braintreeTokenController(req, res);

    // Assert
    expect(logSpy).toHaveBeenCalledWith(thrown);
    logSpy.mockRestore();
  });

  // ZYON AARONEL WEE ZHUN WEI, A0277598B
  it("returns a client token when gateway succeeds", async () => {
    // Arrange
    const req = {};
    const res = createRes();
    const response = { clientToken: "token" };
    mockGenerate.mockImplementation((_args, cb) => cb(null, response));

    // Act
    await braintreeTokenController(req, res);

    // Assert
    expect(mockGenerate).toHaveBeenCalledWith({}, expect.any(Function));
    expect(res.send).toHaveBeenCalledWith(response);
  });

  // ZYON AARONEL WEE ZHUN WEI, A0277598B
  it("returns 500 when gateway token generation fails", async () => {
    // Arrange
    const req = {};
    const res = createRes();
    const error = new Error("gateway down");
    mockGenerate.mockImplementation((_args, cb) => cb(error));

    // Act
    await braintreeTokenController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(error);
  });

  // ZYON AARONEL WEE ZHUN WEI, A0277598B
  it("logs error when payment sale throws", async () => {
    // Arrange
    const req = {
      body: { nonce: "nonce-999", cart: [] },
      user: { _id: "user-9" },
    };
    const res = createRes();
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const thrown = new Error("sale failed");
    mockSale.mockImplementation(() => {
      throw thrown;
    });

    // Act
    await brainTreePaymentController(req, res);

    // Assert
    expect(logSpy).toHaveBeenCalledWith(thrown);
    logSpy.mockRestore();
  });

  // ZYON AARONEL WEE ZHUN WEI, A0277598B
  it("creates an order and responds ok for successful payment", async () => {
    // Arrange
    const req = {
      body: {
        nonce: "nonce-123",
        cart: [{ price: 10 }, { price: 15 }],
      },
      user: { _id: "user-1" },
    };
    const res = createRes();

    mockSale.mockImplementation((payload, cb) => cb(null, { id: "tx" }));

    // Act
    await brainTreePaymentController(req, res);

    // Assert
    expect(mockSale).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 25,
        paymentMethodNonce: "nonce-123",
        options: { submitForSettlement: true },
      }),
      expect.any(Function)
    );

    // We can infer order saved via response JSON
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  // ZYON AARONEL WEE ZHUN WEI, A0277598B
  it("returns 500 when payment fails", async () => {
    // Arrange
    const req = {
      body: {
        nonce: "nonce-456",
        cart: [{ price: 5 }],
      },
      user: { _id: "user-2" },
    };
    const res = createRes();
    const error = new Error("card declined");
    mockSale.mockImplementation((payload, cb) => cb(error, null));

    // Act
    await brainTreePaymentController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(error);
  });
});
