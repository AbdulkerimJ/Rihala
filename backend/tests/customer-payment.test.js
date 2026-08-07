import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import {
  createCustomerPaymentService,
  getCustomerPaymentsService,
  updateCustomerPaymentService,
  voidCustomerPaymentService,
} from "../src/modules/customerPayments/customerPayment.service.js";

import CustomerPayment from "../src/modules/customerPayments/customerPayment.model.js";
import Order from "../src/modules/orders/order.model.js";
import Customer from "../src/modules/customers/customer.model.js";
import User from "../src/modules/users/user.model.js";
import ValidationError from "../src/core/errors/ValidationError.js";
import NotFoundError from "../src/core/errors/NotFoundError.js";

const checkTransactionSupport = async () => {
  try {
    await Customer.createCollection();
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      await Customer.create([{ name: "Tx Check", phone: "0911223345" }], { session });
      throw new Error("TxCheckAbort");
    });
    session.endSession();
    return true;
  } catch (error) {
    if (error.message.includes("Transaction numbers are only allowed on a replica set member or mongos")) {
      return false;
    }
    if (error.message.includes("TxCheckAbort")) {
      return true;
    }
    throw error;
  }
};

test("Customer Payments module test suite", async (t) => {
  let isTransactionSupported = false;

  await t.test("Setup database connection", async () => {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not set in .env");
    }
    await mongoose.connect(process.env.MONGODB_URI, { dbName: "rihala_test_cp_atlas" });
    await CustomerPayment.createCollection();
    await Order.createCollection();
    await Customer.createCollection();
    await User.createCollection();

    isTransactionSupported = await checkTransactionSupport();
  });

  const setupUser = async () => {
    await User.deleteMany({});
    const user = await User.create({
      name: "Test Admin",
      email: "admin.cp@rihala.local",
      password: "password123",
      role: "admin",
      status: "active"
    });
    return user._id;
  };

  const setupOrder = async (userId, agreedAmount, status = "pending") => {
    const customer = await Customer.create({
      name: "Test Customer",
      phone: `0911${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
      email: `customer${Math.floor(Math.random() * 1000000)}@test.local`
    });

    const count = await Order.countDocuments();
    const order = await Order.create({
      orderNumber: `ORD-${count + 1}`,
      customer: customer._id,
      customerName: customer.name,
      customerPhone: customer.phone,
      createdBy: userId,
      date: new Date(),
      items: [{ description: "Table", quantity: 1, unit: "pc" }],
      agreedAmount: agreedAmount,
      expectedCompletionDate: new Date(),
      status: status
    });

    return { customer, order };
  };

  await t.test("Creation: Valid payment is created and snapshots correctly", async () => {
    if (!isTransactionSupported) throw new Error("Transactions not supported. Tests require replica set.");
    await CustomerPayment.deleteMany({});
    await Order.deleteMany({});
    await Customer.deleteMany({});
    
    const userId = await setupUser();
    const { order } = await setupOrder(userId, 1000);

    const payment = await createCustomerPaymentService({
      order: order._id,
      amount: 400,
      paymentDate: new Date(),
      note: "Deposit"
    }, userId);

    assert.equal(payment.amount, 400);
    assert.equal(payment.order.toString(), order._id.toString());
    assert.equal(payment.customerName, "Test Customer");
    assert.equal(payment.orderNumber, order.orderNumber);
    assert.equal(payment.status, "active");
  });

  await t.test("Creation: Nonexistent Order is rejected", async () => {
    const userId = await setupUser();
    const fakeId = new mongoose.Types.ObjectId();

    await assert.rejects(
      () => createCustomerPaymentService({
        order: fakeId,
        amount: 100,
        paymentDate: new Date(),
      }, userId),
      NotFoundError,
      /Order not found/
    );
  });

  await t.test("Creation: Cancelled Order cannot receive payment", async () => {
    const userId = await setupUser();
    const { order } = await setupOrder(userId, 1000, "cancelled");

    await assert.rejects(
      () => createCustomerPaymentService({
        order: order._id,
        amount: 100,
        paymentDate: new Date(),
      }, userId),
      ValidationError,
      /Cannot create payment for a cancelled order/
    );
  });

  await t.test("Creation: Payment cannot exceed remaining amount", async () => {
    await CustomerPayment.deleteMany({});
    const userId = await setupUser();
    const { order } = await setupOrder(userId, 1000);

    await createCustomerPaymentService({ order: order._id, amount: 600, paymentDate: new Date() }, userId);

    await assert.rejects(
      () => createCustomerPaymentService({ order: order._id, amount: 500, paymentDate: new Date() }, userId),
      ValidationError,
      /exceeds the remaining balance/
    );
  });

  await t.test("Creation: Fully paid Order cannot receive another payment", async () => {
    await CustomerPayment.deleteMany({});
    const userId = await setupUser();
    const { order } = await setupOrder(userId, 1000);

    await createCustomerPaymentService({ order: order._id, amount: 1000, paymentDate: new Date() }, userId);

    await assert.rejects(
      () => createCustomerPaymentService({ order: order._id, amount: 100, paymentDate: new Date() }, userId),
      ValidationError,
      /Order is already fully paid/
    );
  });

  await t.test("Creation: Completed Order can receive payment", async () => {
    await CustomerPayment.deleteMany({});
    const userId = await setupUser();
    const { order } = await setupOrder(userId, 1000, "completed");

    const payment = await createCustomerPaymentService({ order: order._id, amount: 500, paymentDate: new Date() }, userId);
    assert.equal(payment.amount, 500);
  });

  await t.test("Creation: Partial payment works", async () => {
    await CustomerPayment.deleteMany({});
    const userId = await setupUser();
    const { order } = await setupOrder(userId, 1000);

    await createCustomerPaymentService({ order: order._id, amount: 400, paymentDate: new Date() }, userId);
    const p2 = await createCustomerPaymentService({ order: order._id, amount: 600, paymentDate: new Date() }, userId);
    
    assert.equal(p2.amount, 600);
  });

  await t.test("Historical Integrity: Order/Customer changes do not alter payment snapshot", async () => {
    await CustomerPayment.deleteMany({});
    const userId = await setupUser();
    const { order, customer } = await setupOrder(userId, 1000);

    const payment = await createCustomerPaymentService({
      order: order._id,
      amount: 100,
      paymentDate: new Date()
    }, userId);

    assert.equal(payment.customerName, "Test Customer");

    // Change customer name on order
    order.customerName = "Changed Customer";
    await order.save();

    const fetchedPayment = await CustomerPayment.findById(payment._id);
    assert.equal(fetchedPayment.customerName, "Test Customer"); // Should be unchanged
  });

  await t.test("Voiding: Active payment can be voided and restores balance", async () => {
    await CustomerPayment.deleteMany({});
    const userId = await setupUser();
    const { order } = await setupOrder(userId, 1000);

    const payment = await createCustomerPaymentService({ order: order._id, amount: 1000, paymentDate: new Date() }, userId);

    const voided = await voidCustomerPaymentService(payment._id, "Mistake", userId);
    assert.equal(voided.status, "voided");
    assert.equal(voided.voidReason, "Mistake");
    assert.equal(voided.voidedBy._id.toString(), userId.toString());

    // Because it's voided, we should be able to pay again
    const newPayment = await createCustomerPaymentService({ order: order._id, amount: 1000, paymentDate: new Date() }, userId);
    assert.equal(newPayment.amount, 1000);
  });

  await t.test("Transactions: Concurrent payments exceeding balance", async () => {
    await CustomerPayment.deleteMany({});
    const userId = await setupUser();
    const { order } = await setupOrder(userId, 1000);

    // Simulate concurrent requests
    const results = await Promise.allSettled([
      createCustomerPaymentService({ order: order._id, amount: 600, paymentDate: new Date() }, userId),
      createCustomerPaymentService({ order: order._id, amount: 600, paymentDate: new Date() }, userId)
    ]);

    const successes = results.filter(r => r.status === "fulfilled");
    const failures = results.filter(r => r.status === "rejected");

    assert.equal(successes.length, 1);
    assert.equal(failures.length, 1);

    const totalActive = await CustomerPayment.find({ order: order._id, status: "active" });
    assert.equal(totalActive.length, 1);
    assert.equal(totalActive[0].amount, 600);
  });

  await t.test("Queries: default to active status", async () => {
    await CustomerPayment.deleteMany({});
    const userId = await setupUser();
    const { order } = await setupOrder(userId, 1000);

    await createCustomerPaymentService({ order: order._id, amount: 100, paymentDate: new Date() }, userId);
    const p2 = await createCustomerPaymentService({ order: order._id, amount: 200, paymentDate: new Date() }, userId);

    await voidCustomerPaymentService(p2._id, "Voided", userId);

    const result = await getCustomerPaymentsService({ order: order._id.toString() });
    assert.equal(result.data.length, 1);
    assert.equal(result.data[0].amount, 100);
  });

  await t.test("Teardown database connection", async () => {
    await mongoose.disconnect();
  });
});
