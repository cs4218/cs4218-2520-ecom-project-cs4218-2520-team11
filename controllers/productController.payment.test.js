import { jest } from "@jest/globals";

const mockGenerate = jest.fn();
const mockSale = jest.fn();
const orderModelMock = jest.fn();

jest.unstable_mockModule("braintree", () => ({
  default: {
    BraintreeGateway: jest.fn().mockImplementation(() => ({
      clientToken: { generate: mockGenerate },
      transaction: { sale: mockSale },
    })),
    Environment: { Sandbox: "sandbox" },
  },
}));

jest.unstable_mockModule("../models/orderModel.js", () => ({
  default: orderModelMock,
}));

jest.unstable_mockModule("../models/productModel.js", () => ({
  default: jest.fn(),
}));

jest.unstable_mockModule("../models/categoryModel.js", () => ({
  default: jest.fn(),
}));

let braintreeTokenController;
let brainTreePaymentController;

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("productController payment", () => {
  beforeAll(async () => {
    const module = await import("./productController.js");
    braintreeTokenController = module.braintreeTokenController;
    brainTreePaymentController = module.brainTreePaymentController;
  });

  beforeEach(() => {
    jest.clearAllMocks();
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
    const saveMock = jest.fn().mockResolvedValue({});
    orderModelMock.mockImplementation((payload) => ({
      save: saveMock,
      payload,
    }));
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
    expect(orderModelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        products: req.body.cart,
        payment: { id: "tx" },
        buyer: "user-1",
      })
    );
    expect(saveMock).toHaveBeenCalled();
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
    expect(orderModelMock).not.toHaveBeenCalled();
  });
});
