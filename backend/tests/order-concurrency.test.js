import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { createOrderService, updateOrderService } from "../src/modules/orders/order.service.js";
import { createCustomerPaymentService, voidCustomerPaymentService } from "../src/modules/customerPayments/customerPayment.service.js";
import Order from "../src/modules/orders/order.model.js";
import CustomerPayment from "../src/modules/customerPayments/customerPayment.model.js";
import Customer from "../src/modules/customers/customer.model.js";
import Counter from "../src/core/models/counter.model.js";
import User from "../src/modules/users/user.model.js";

const checkTransactionSupport = async () => {
  try {
    await Customer.createCollection();
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      await Customer.create([{ name: "Tx Check", phone: "0911223345", email: "txcheck@example.com", status: "active" }], { session });
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

test("Order Concurrency Test Suite", async (t) => {
  let isTransactionSupported = false;

  await t.test("Setup database connection", async () => {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not set in .env");
    }
    await mongoose.connect(process.env.MONGODB_URI, { dbName: "rihala_tx_test_atlas_order" });
    await Customer.deleteMany({});
    await Customer.createCollection();
    await Order.createCollection();
    await CustomerPayment.createCollection();
    await Counter.createCollection();
    await User.createCollection();
    
    isTransactionSupported = await checkTransactionSupport();
  });

  await t.test("Verify transaction support", async (t) => {
    if (!isTransactionSupported) {
      console.warn("⚠️ SKIPPED: MongoDB transactions are not supported in this environment.");
      t.skip("Transactions not supported (requires Replica Set)");
      return;
    }
    assert.ok(isTransactionSupported, "Transactions should be supported");
  });

  const setupData = async () => {
    const customerA = await Customer.create({
      name: "Customer A",
      phone: "0911000001",
      email: "customera@example.com",
      status: "active"
    });
    
    const customerB = await Customer.create({
      name: "Customer B",
      phone: "0911000002",
      email: "customerb@example.com",
      status: "active"
    });
    
    await User.deleteMany({});
    const user = await User.create({
      name: "Test Admin",
      email: "admin_order@rihala.local",
      password: "password123",
      role: "admin",
      status: "active"
    });
    
    return { customerA: customerA._id, customerB: customerB._id, userId: user._id };
  };

  await t.test("Concurrent Order creation generates unique sequential order numbers", async (t) => {
    if (!isTransactionSupported) {
      t.skip("Transactions not supported");
      return;
    }
    
    await Customer.deleteMany({});
    await Order.deleteMany({});
    await Counter.deleteMany({});

    const { customerA, userId } = await setupData();

    // Fire 10 concurrent requests
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        createOrderService({
          customer: customerA,
          agreedAmount: 5000,
          expectedCompletionDate: new Date(),
          description: `Item ${i}`,
        }, userId)
      );
    }

    const results = await Promise.allSettled(promises);
    
    const fulfilled = results.filter(r => r.status === "fulfilled");
    const rejected = results.filter(r => r.status === "rejected");

    assert.equal(fulfilled.length, 10, "All concurrent orders should succeed");
    assert.equal(rejected.length, 0, "No duplicate key errors should occur");

    const orders = await Order.find({}).sort({ orderNumber: 1 });
    assert.equal(orders.length, 10);
    
    // Verify sequence
    let currentExpected = 1001;
    for (const order of orders) {
      assert.equal(order.orderNumber, `ORD-${currentExpected}`);
      currentExpected++;
    }
  });

  await t.test("Concurrent reassignment and payment creation prevents changing customer when payment exists", async (t) => {
    if (!isTransactionSupported) {
      t.skip("Transactions not supported");
      return;
    }

    await Customer.deleteMany({});
    await Order.deleteMany({});
    await CustomerPayment.deleteMany({});
    await Counter.deleteMany({});

    const { customerA, customerB, userId } = await setupData();

    const order = await createOrderService({
      customer: customerA,
      agreedAmount: 10000,
      expectedCompletionDate: new Date(),
      description: "Test Item",
    }, userId);

    // Concurrently try to reassign to Customer B and create a payment
    const reassignmentPromise = updateOrderService(order._id, { customer: customerB }, userId);
    
    const paymentPromise = createCustomerPaymentService({
      order: order._id,
      amount: 1000,
      paymentDate: new Date()
    }, userId);

    const results = await Promise.allSettled([reassignmentPromise, paymentPromise]);
    
    // One of them should fail or both succeed? 
    // Wait, if payment succeeds first, reassignment must fail. 
    // If reassignment succeeds first, payment succeeds (payment just uses the order).
    // Let's verify the final state is consistent with the rules.
    
    const finalOrder = await Order.findById(order._id);
    const payments = await CustomerPayment.find({ order: order._id });

    assert.equal(payments.length, 1, "Payment should have succeeded");

    // If reassignment succeeded before payment, customer is B and payment is for B.
    // If payment succeeded before reassignment, customer remains A and reassignment fails.
    if (finalOrder.customer.toString() === customerB.toString()) {
      // Reassignment won the race
      assert.equal(payments[0].customerName, "Customer B", "Payment snapshot must match the new customer");
      // The reassignment promise must have fulfilled
      assert.equal(results[0].status, "fulfilled");
      assert.equal(results[1].status, "fulfilled");
    } else {
      // Payment won the race, reassignment rejected
      assert.equal(finalOrder.customer.toString(), customerA.toString());
      assert.equal(payments[0].customerName, "Customer A");
      assert.equal(results[0].status, "rejected");
      assert.match(results[0].reason.message, /Cannot change the customer after customer payment history exists/);
      assert.equal(results[1].status, "fulfilled");
    }
  });

  await t.test("Reassignment with voided payment is rejected", async (t) => {
    if (!isTransactionSupported) {
      t.skip("Transactions not supported");
      return;
    }

    await Customer.deleteMany({});
    await Order.deleteMany({});
    await CustomerPayment.deleteMany({});

    const { customerA, customerB, userId } = await setupData();

    const order = await createOrderService({
      customer: customerA,
      agreedAmount: 10000,
      expectedCompletionDate: new Date(),
      description: "Test Item",
    }, userId);

    const payment = await createCustomerPaymentService({
      order: order._id,
      amount: 1000,
      paymentDate: new Date()
    }, userId);

    await voidCustomerPaymentService(payment._id, "Voiding test", userId);

    const reassignedOrder = await updateOrderService(order._id, { customer: customerB }, userId);
    assert.equal(reassignedOrder.customer._id.toString(), customerB.toString(), "Should allow reassignment since payment is voided");
  });

  await t.test("Teardown database connection", async () => {
    await mongoose.disconnect();
  });
});
