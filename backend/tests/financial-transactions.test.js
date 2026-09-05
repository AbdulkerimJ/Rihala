import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { createPurchaseService, updatePurchaseService } from "../src/modules/purchases/purchase.service.js";
import { createSupplierPaymentService, voidSupplierPaymentService } from "../src/modules/supplierPayments/supplierPayment.service.js";
import User from "../src/modules/users/user.model.js";

import Supplier from "../src/modules/suppliers/supplier.model.js";
import Material from "../src/modules/materials/material.model.js";
import Purchase from "../src/modules/purchases/purchase.model.js";
import SupplierPayment from "../src/modules/supplierPayments/supplierPayment.model.js";

// Helper to check if transactions are supported
const checkTransactionSupport = async () => {
  try {
    await Supplier.createCollection();
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      // Attempt a write to trigger the server error if not replica set
      await Supplier.create([{ name: "Tx Check", phone: "0911223345", status: "active" }], { session });
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

test("Financial transactions test suite", async (t) => {
  let isTransactionSupported = false;

  await t.test("Setup database connection", async () => {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not set in .env");
    }
    await mongoose.connect(process.env.MONGODB_URI, { dbName: "rihala_tx_test_atlas" });
    await Supplier.createCollection();
    await Material.createCollection();
    await Purchase.createCollection();
    await SupplierPayment.createCollection();
    await User.createCollection();
    
    isTransactionSupported = await checkTransactionSupport();
  });

  await t.test("Verify transaction support", async (t) => {
    if (!isTransactionSupported) {
      console.warn("⚠️ SKIPPED: MongoDB transactions are not supported in this environment.");
      console.warn("⚠️ REQUIREMENT: A MongoDB Replica Set is required to run transaction tests.");
      t.skip("Transactions not supported (requires Replica Set)");
      return;
    }
    assert.ok(isTransactionSupported, "Transactions should be supported");
  });

  const setupData = async () => {
    const supplier = await Supplier.create({
      name: "Test Supplier",
      phone: "0911223344",
      status: "active"
    });
    const material = await Material.create({
      name: "Test Material",
      category: "MDF",
      unit: "piece",
      price: 100,
      minQuantity: 1,
      status: "active"
    });
    
    await User.deleteMany({});
    const user = await User.create({
      name: "Test Admin",
      email: "admin@rihala.local",
      password: "password123",
      role: "admin",
      status: "active"
    });
    
    return { supplierId: supplier._id, materialId: material._id, userId: user._id };
  };

  await t.test("Successful purchase creation commits all related changes", async (t) => {
    if (!isTransactionSupported) {
      t.skip("Transactions not supported");
      return;
    }
    
    await Supplier.deleteMany({});
    await Material.deleteMany({});
    await Purchase.deleteMany({});
    await SupplierPayment.deleteMany({});

    const { supplierId, materialId } = await setupData();
    
    // Have a payment with credit first
    const payment = await SupplierPayment.create({
      paymentReference: "PAY-1",
      supplier: supplierId,
      type: "GENERAL",
      amount: 1000,
      date: new Date(),
      allocations: [],
      unallocatedAmount: 1000
    });

    const purchase = await createPurchaseService({
      supplier: supplierId,
      date: new Date(),
      items: [{ material: materialId, quantity: 5, unitPrice: 100 }], // 500 total
      note: "Test purchase"
    });

    assert.equal(purchase.totalAmount, 500);
    assert.equal(purchase.allocatedAmount, 500); // Because of the credit
    assert.equal(purchase.paymentStatus, "PAID");

    const updatedPayment = await SupplierPayment.findById(payment._id);
    assert.equal(updatedPayment.unallocatedAmount, 500);
    assert.equal(updatedPayment.allocations.length, 1);
    assert.equal(updatedPayment.allocations[0].amount, 500);
  });

  await t.test("A failure during purchase allocation rolls back the purchase and supplier-payment changes", async (t) => {
    if (!isTransactionSupported) {
      t.skip("Transactions not supported");
      return;
    }

    await Supplier.deleteMany({});
    await Material.deleteMany({});
    await Purchase.deleteMany({});
    await SupplierPayment.deleteMany({});

    const { supplierId, materialId } = await setupData();

    const payment = await SupplierPayment.create({
      paymentReference: "PAY-2",
      supplier: supplierId,
      type: "GENERAL",
      amount: 1000,
      date: new Date(),
      allocations: [],
      unallocatedAmount: 1000
    });

    // Mock SupplierPayment.find to throw an error during applyCreditToPurchase
    const originalFind = SupplierPayment.find;
    SupplierPayment.find = function() {
       throw new Error("Simulated Allocation Failure");
    };

    try {
      await assert.rejects(
        () => createPurchaseService({
          supplier: supplierId,
          date: new Date(),
          items: [{ material: materialId, quantity: 5, unitPrice: 100 }]
        }),
        /Simulated Allocation Failure/
      );
    } finally {
      SupplierPayment.find = originalFind;
    }

    // Verify rollback
    const purchases = await Purchase.find({});
    assert.equal(purchases.length, 0, "Purchase should have been rolled back");

    const updatedPayment = await SupplierPayment.findById(payment._id);
    assert.equal(updatedPayment.unallocatedAmount, 1000, "Payment unallocated amount should not have changed");
    assert.equal(updatedPayment.allocations.length, 0, "Payment should not have allocations");
  });

  await t.test("A failure during supplier-payment allocation rolls back the payment and purchase changes", async (t) => {
    if (!isTransactionSupported) {
      t.skip("Transactions not supported");
      return;
    }
    
    await Supplier.deleteMany({});
    await Material.deleteMany({});
    await Purchase.deleteMany({});
    await SupplierPayment.deleteMany({});

    const { supplierId, materialId } = await setupData();

    // Have an outstanding purchase first
    const purchase = await Purchase.create({
      purchaseNumber: "PUR-99",
      supplier: supplierId,
      date: new Date(),
      items: [{ material: materialId, materialName: "A", materialCategory: "B", quantity: 1, unit: "C", unitPrice: 1000, subtotal: 1000 }],
      totalAmount: 1000,
      allocatedAmount: 0,
      paymentStatus: "UNPAID"
    });

    const originalFind = Purchase.find;
    Purchase.find = function() {
        throw new Error("Simulated Payment Allocation Failure");
    };

    try {
      await assert.rejects(
        () => createSupplierPaymentService({
          supplier: supplierId,
          type: "GENERAL",
          amount: 500,
          date: new Date()
        }),
        /Simulated Payment Allocation Failure/
      );
    } finally {
      Purchase.find = originalFind;
    }

    // Verify rollback
    const payments = await SupplierPayment.find({});
    assert.equal(payments.length, 0, "Payment should have been rolled back");

    const updatedPurchase = await Purchase.findById(purchase._id);
    assert.equal(updatedPurchase.allocatedAmount, 0, "Purchase allocation should not have changed");
    assert.equal(updatedPurchase.paymentStatus, "UNPAID", "Purchase payment status should remain UNPAID");
  });

  await t.test("Purchase reconciliation failure does not leave partial allocation changes", async (t) => {
    if (!isTransactionSupported) {
      t.skip("Transactions not supported");
      return;
    }

    await Supplier.deleteMany({});
    await Material.deleteMany({});
    await Purchase.deleteMany({});
    await SupplierPayment.deleteMany({});

    const { supplierId, materialId } = await setupData();

    // Create a purchase and fully pay it
    const purchase = await Purchase.create({
      purchaseNumber: "PUR-100",
      supplier: supplierId,
      date: new Date(),
      items: [{ material: materialId, materialName: "A", materialCategory: "B", quantity: 10, unit: "C", unitPrice: 100, subtotal: 1000 }],
      totalAmount: 1000,
      allocatedAmount: 500,
      paymentStatus: "PARTIALLY_PAID"
    });

    const payment = await SupplierPayment.create({
      paymentReference: "PAY-100",
      supplier: supplierId,
      type: "SPECIFIC",
      amount: 500,
      date: new Date(),
      allocations: [{ purchase: purchase._id, amount: 500 }],
      unallocatedAmount: 0
    });

    // Mock SupplierPayment.find to throw in reconcilePurchaseTotal
    const originalFind = SupplierPayment.find;
    SupplierPayment.find = function() {
       throw new Error("Simulated Reconciliation Failure");
    };

    try {
      await assert.rejects(
        () => updatePurchaseService(purchase._id, {
           items: [{ material: materialId, quantity: 4, unitPrice: 100 }] // total drops to 400
        }),
        /Simulated Reconciliation Failure/
      );
    } finally {
      SupplierPayment.find = originalFind;
    }

    // Verify rollback
    const pAfter = await Purchase.findById(purchase._id);
    assert.equal(pAfter.totalAmount, 1000, "Purchase total amount should be rolled back");
    assert.equal(pAfter.allocatedAmount, 500, "Purchase allocated amount should be rolled back");

    const payAfter = await SupplierPayment.findById(payment._id);
    assert.equal(payAfter.unallocatedAmount, 0, "Payment unallocated amount should be rolled back");
    assert.equal(payAfter.allocations[0].amount, 500, "Payment allocation should be rolled back");
  });

  await t.test("Financial invariants are maintained after complex operations", async (t) => {
    if (!isTransactionSupported) {
      t.skip("Transactions not supported");
      return;
    }

    await Supplier.deleteMany({});
    await Material.deleteMany({});
    await Purchase.deleteMany({});
    await SupplierPayment.deleteMany({});

    const { supplierId, materialId } = await setupData();

    // 1. Create a purchase (1000)
    const purchase = await createPurchaseService({
      supplier: supplierId,
      date: new Date(),
      items: [{ material: materialId, quantity: 10, unitPrice: 100 }],
      note: "Invariant test"
    });

    // 2. Pay partially (500) -> 500 allocated, 0 unallocated
    const payment = await createSupplierPaymentService({
      supplier: supplierId,
      type: "GENERAL",
      amount: 500,
      date: new Date()
    });

    // Fetch fresh data
    const p1 = await Purchase.findById(purchase._id);
    const pay1 = await SupplierPayment.findById(payment._id);

    // Invariant: allocatedAmount >= 0
    assert.ok(p1.allocatedAmount >= 0);
    
    // Invariant: allocatedAmount <= totalAmount
    assert.ok(p1.allocatedAmount <= p1.totalAmount);
    
    // Invariant: unallocatedAmount >= 0
    assert.ok(pay1.unallocatedAmount >= 0);

    // Invariant: allocation.amount > 0
    for (const alloc of pay1.allocations) {
      assert.ok(alloc.amount > 0);
    }

    // Invariant: sum(payment.allocations.amount) + payment.unallocatedAmount <= payment.amount
    const sumAlloc = pay1.allocations.reduce((sum, a) => sum + a.amount, 0);
    assert.ok(sumAlloc + pay1.unallocatedAmount <= pay1.amount);
    
    // Invariant: remainingAmount = totalAmount - allocatedAmount
    const p1Remaining = p1.totalAmount - p1.allocatedAmount;
    assert.ok(p1Remaining >= 0);

    // Now let's change purchase total to 400 (decrease) -> drops below allocated
    await updatePurchaseService(p1._id, {
      items: [{ material: materialId, quantity: 4, unitPrice: 100 }]
    });

    const p2 = await Purchase.findById(purchase._id);
    const pay2 = await SupplierPayment.findById(payment._id);

    // Check invariants again
    assert.ok(p2.allocatedAmount >= 0);
    assert.ok(p2.allocatedAmount <= p2.totalAmount); // Should be 400 <= 400
    assert.ok(pay2.unallocatedAmount >= 0); // Should be 500 - 400 = 100
    
    for (const alloc of pay2.allocations) {
      assert.ok(alloc.amount > 0);
    }
    
    const sumAlloc2 = pay2.allocations.reduce((sum, a) => sum + a.amount, 0);
    assert.ok(sumAlloc2 + pay2.unallocatedAmount <= pay2.amount);
    assert.ok(p2.totalAmount - p2.allocatedAmount >= 0);
  });

  await t.test("Voiding a supplier payment reverses allocations and clears unallocated credit", async (t) => {
    if (!isTransactionSupported) {
      t.skip("Transactions not supported");
      return;
    }

    await Supplier.deleteMany({});
    await Material.deleteMany({});
    await Purchase.deleteMany({});
    await SupplierPayment.deleteMany({});

    const { supplierId, materialId, userId } = await setupData();

    // Create a purchase (1000)
    const purchase = await createPurchaseService({
      supplier: supplierId,
      date: new Date(),
      items: [{ material: materialId, quantity: 10, unitPrice: 100 }],
      note: "Purchase to be voided against"
    });

    // Create a SPECIFIC payment (1000)
    const payment = await createSupplierPaymentService({
      supplier: supplierId,
      type: "SPECIFIC",
      amount: 1000,
      purchaseId: purchase._id,
      date: new Date()
    });

    // Check pre-void state
    let pBefore = await Purchase.findById(purchase._id);
    assert.equal(pBefore.allocatedAmount, 1000);
    assert.equal(pBefore.paymentStatus, "PAID");

    // Void the payment
    const voidedPayment = await voidSupplierPaymentService(payment._id, "Entered by mistake", userId);
    
    assert.equal(voidedPayment.status, "voided");
    assert.equal(voidedPayment.unallocatedAmount, 0);
    assert.equal(voidedPayment.allocations.length, 0);
    assert.equal(voidedPayment.voidReason, "Entered by mistake");
    assert.equal(voidedPayment.voidedBy._id.toString(), userId.toString());

    // Check post-void state on Purchase
    let pAfter = await Purchase.findById(purchase._id);
    assert.equal(pAfter.allocatedAmount, 0);
    assert.equal(pAfter.paymentStatus, "UNPAID");

    // Try voiding again
    await assert.rejects(
      () => voidSupplierPaymentService(payment._id, "Double void", userId),
      /Payment is already voided/
    );
  });

  await t.test("Concurrent specific payments to same purchase are safely serialized", async (t) => {
    if (!isTransactionSupported) {
      t.skip("Transactions not supported");
      return;
    }

    await Supplier.deleteMany({});
    await Material.deleteMany({});
    await Purchase.deleteMany({});
    await SupplierPayment.deleteMany({});

    const { supplierId, materialId } = await setupData();

    // Create a purchase (1000)
    const purchase = await createPurchaseService({
      supplier: supplierId,
      date: new Date(),
      items: [{ material: materialId, quantity: 10, unitPrice: 100 }],
      note: "Concurrent specific purchase"
    });

    // Attempt two specific payments of 700 concurrently
    const p1 = createSupplierPaymentService({
      supplier: supplierId,
      type: "SPECIFIC",
      amount: 700,
      purchaseId: purchase._id,
      date: new Date()
    });
    const p2 = createSupplierPaymentService({
      supplier: supplierId,
      type: "SPECIFIC",
      amount: 700,
      purchaseId: purchase._id,
      date: new Date()
    });

    const results = await Promise.allSettled([p1, p2]);
    
    const fulfilled = results.filter(r => r.status === "fulfilled");
    const rejected = results.filter(r => r.status === "rejected");

    assert.equal(fulfilled.length, 1, "Only one payment should succeed");
    assert.equal(rejected.length, 1, "One payment must fail due to insufficient remaining balance");

    assert.match(rejected[0].reason.message, /Payment amount \(700\) exceeds purchase remaining amount/);

    const finalPurchase = await Purchase.findById(purchase._id);
    assert.equal(finalPurchase.allocatedAmount, 700, "Purchase allocation must not exceed total amount");
    assert.equal(finalPurchase.paymentStatus, "PARTIALLY_PAID");
  });

  await t.test("Teardown database connection", async () => {
    await mongoose.disconnect();
  });
});
