import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import { createPurchaseService, updatePurchaseService } from "../src/modules/purchases/purchase.service.js";
import { createSupplierPaymentService, updateSupplierPaymentService } from "../src/modules/supplierPayments/supplierPayment.service.js";
import * as allocationService from "../src/modules/supplierPayments/allocation.service.js";

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
    await mongoose.connect("mongodb://127.0.0.1:27017/rihala_tx_test");
    await Supplier.createCollection();
    await Material.createCollection();
    await Purchase.createCollection();
    await SupplierPayment.createCollection();
    
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
    return { supplierId: supplier._id, materialId: material._id };
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
      allocatedAmount: 1000,
      paymentStatus: "PAID"
    });

    const payment = await SupplierPayment.create({
      paymentReference: "PAY-100",
      supplier: supplierId,
      type: "SPECIFIC",
      amount: 1000,
      date: new Date(),
      allocations: [{ purchase: purchase._id, amount: 1000 }],
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
           items: [{ material: materialId, quantity: 5, unitPrice: 100 }] // total drops to 500
        }),
        /Simulated Reconciliation Failure/
      );
    } finally {
      SupplierPayment.find = originalFind;
    }

    // Verify rollback
    const pAfter = await Purchase.findById(purchase._id);
    assert.equal(pAfter.totalAmount, 1000, "Purchase total amount should be rolled back");
    assert.equal(pAfter.allocatedAmount, 1000, "Purchase allocated amount should be rolled back");

    const payAfter = await SupplierPayment.findById(payment._id);
    assert.equal(payAfter.unallocatedAmount, 0, "Payment unallocated amount should be rolled back");
    assert.equal(payAfter.allocations[0].amount, 1000, "Payment allocation should be rolled back");
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

    // 2. Overpay generally (1500) -> 1000 allocated, 500 unallocated
    const payment = await createSupplierPaymentService({
      supplier: supplierId,
      type: "GENERAL",
      amount: 1500,
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

    // Now let's change purchase total to 800 (decrease) -> drops below allocated
    await updatePurchaseService(p1._id, {
      items: [{ material: materialId, quantity: 8, unitPrice: 100 }]
    });

    const p2 = await Purchase.findById(purchase._id);
    const pay2 = await SupplierPayment.findById(payment._id);

    // Check invariants again
    assert.ok(p2.allocatedAmount >= 0);
    assert.ok(p2.allocatedAmount <= p2.totalAmount); // Should be 800 <= 800
    assert.ok(pay2.unallocatedAmount >= 0); // Should be 1500 - 800 = 700
    
    for (const alloc of pay2.allocations) {
      assert.ok(alloc.amount > 0);
    }
    
    const sumAlloc2 = pay2.allocations.reduce((sum, a) => sum + a.amount, 0);
    assert.ok(sumAlloc2 + pay2.unallocatedAmount <= pay2.amount);
    assert.ok(p2.totalAmount - p2.allocatedAmount >= 0);
  });

  await t.test("Teardown database connection", async () => {
    await mongoose.disconnect();
  });
});
