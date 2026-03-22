import { jest } from "@jest/globals";
import mongoose from "mongoose";
import braintree from "braintree";
import orderModel from "../models/orderModel.js";
import {
  braintreeTokenController,
  brainTreePaymentController,
} from "./productController.js";

jest.mock("braintree", () => {
  const mockGenerate = jest.fn();
  const mockSale = jest.fn();
  return {
    __esModule: true,
    default: {
      BraintreeGateway: jest.fn().mockImplementation(() => ({
        clientToken: { generate: mockGenerate },
        transaction: { sale: mockSale },
      })),
      Environment: { Sandbox: "sandbox" },
      mockGenerate,
      mockSale,
    },
  };
});

const mockGenerate = braintree.mockGenerate;
const mockSale = braintree.mockSale;

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("productController payment integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Zyon Aaronel Wee Zhun Wei, A0277598B
  it("returns a client token when the Braintree gateway succeeds", async () => {
    const res = createRes();
    const response = { clientToken: "token" };
    mockGenerate.mockImplementation((_args, cb) => cb(null, response));

    await braintreeTokenController({}, res);

    expect(mockGenerate).toHaveBeenCalledWith({}, expect.any(Function));
    expect(res.send).toHaveBeenCalledWith(response);
  });

  // Zyon Aaronel Wee Zhun Wei, A0277598B
  it("returns 500 when Braintree token generation fails", async () => {
    const res = createRes();
    const error = new Error("gateway down");
    mockGenerate.mockImplementation((_args, cb) => cb(error));

    await braintreeTokenController({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(error);
  });

  // Zyon Aaronel Wee Zhun Wei, A0277598B
  it("creates and saves a real order model document after a successful payment", async () => {
    const buyerId = new mongoose.Types.ObjectId();
    const cart = [
      { _id: new mongoose.Types.ObjectId(), price: 10 },
      { _id: new mongoose.Types.ObjectId(), price: 15 },
    ];
    const req = {
      body: { nonce: "nonce-123", cart },
      user: { _id: buyerId },
    };
    const res = createRes();
    const paymentResult = { id: "tx-1", status: "submitted_for_settlement" };
    let savedOrder = null;

    const saveSpy = jest
      .spyOn(orderModel.prototype, "save")
      .mockImplementation(function () {
        savedOrder = this;
        return Promise.resolve(this);
      });

    mockSale.mockImplementation((payload, cb) => cb(null, paymentResult));

    await brainTreePaymentController(req, res);

    expect(mockSale).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 25,
        paymentMethodNonce: "nonce-123",
        options: { submitForSettlement: true },
      }),
      expect.any(Function)
    );
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(savedOrder).not.toBeNull();
    expect(savedOrder.buyer.toString()).toBe(buyerId.toString());
    expect(savedOrder.products).toHaveLength(2);
    expect(savedOrder.payment).toMatchObject(paymentResult);
    expect(res.json).toHaveBeenCalledWith({ ok: true });

    saveSpy.mockRestore();
  });

  // Zyon Aaronel Wee Zhun Wei, A0277598B
  it("returns 500 when the payment transaction fails", async () => {
    const req = {
      body: {
        nonce: "nonce-456",
        cart: [{ _id: new mongoose.Types.ObjectId(), price: 5 }],
      },
      user: { _id: new mongoose.Types.ObjectId() },
    };
    const res = createRes();
    const error = new Error("card declined");
    mockSale.mockImplementation((payload, cb) => cb(error, null));

    await brainTreePaymentController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(error);
  });
});
