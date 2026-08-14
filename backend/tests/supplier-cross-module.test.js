import test from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
import connectDatabase from "../src/core/database/mongodb.js";
import Supplier from "../src/modules/suppliers/supplier.model.js";
import Material from "../src/modules/materials/material.model.js";
import Purchase from "../src/modules/purchases/purchase.model.js";
import SupplierPayment from "../src/modules/supplierPayments/supplierPayment.model.js";
import User from "../src/modules/users/user.model.js";
import { createPurchaseService, updatePurchaseService } from "../src/modules/purchases/purchase.service.js";
import { createSupplierPaymentService, voidSupplierPaymentService, updateSupplierPaymentService } from "../src/modules/supplierPayments/supplierPayment.service.js";

test("Supplier Cross-Module Integrity Tests", async (t) => {
  let supplierAId;
  let supplierBId;
  let materialId;

  await t.test("Setup database connection and seed", async () => {
    let connected = false;
    for (let i = 0; i < 5; i++) {
      try {
        await connectDatabase();
        connected = true;
        break;
      } catch (err) {
        console.log(`Connection attempt ${i + 1} failed: ${err.message}. Retrying...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    if (!connected) throw new Error("Failed to connect to database");

    await Supplier.deleteMany({});
    await Material.deleteMany({});
    await Purchase.deleteMany({});
    await SupplierPayment.deleteMany({});

    const supplierA = await Supplier.create({ name: "Supplier A", phone: "0911223344" });
    const supplierB = await Supplier.create({ name: "Supplier B", phone: "0922334455" });
    const material = await Material.create({ name: "Wood", unit: "kg", category: "Wood" });

    supplierAId = supplierA._id;
    supplierBId = supplierB._id;
    materialId = material._id;
  });

  await t.test("Test A & D: SPECIFIC credit leakage and zero allocation context", async (t) => {
    const purchaseA = await createPurchaseService({
      supplier: supplierAId,
      date: new Date(),
      items: [{ material: materialId, quantity: 10, unitPrice: 100 }], // Total 1000
    });

    const specificPayment = await createSupplierPaymentService({
      type: "SPECIFIC",
      supplier: supplierAId,
      amount: 800, // Partial payment so it's not "PAID" which locks items
      purchaseId: purchaseA._id,
      date: new Date(),
    });

    assert.strictEqual(specificPayment.allocations[0].purchase._id.toString(), purchaseA._id.toString());
    assert.strictEqual(specificPayment.allocations[0].amount, 800);
    assert.strictEqual(specificPayment.unallocatedAmount, 0);
    assert.strictEqual(specificPayment.purchaseId.toString(), purchaseA._id.toString());

    // Reduce Purchase A total to 900
    await updatePurchaseService(purchaseA._id, {
      items: [{ material: materialId, quantity: 9, unitPrice: 100 }],
    });

    const updatedPayment = await SupplierPayment.findById(specificPayment._id);
    assert.strictEqual(updatedPayment.unallocatedAmount, 0); // No refund yet since 900 > 800
    assert.strictEqual(updatedPayment.allocations[0].amount, 800);
    assert.strictEqual(updatedPayment.purchaseId.toString(), purchaseA._id.toString()); // Still retains context

    // Create Purchase B for 500
    const purchaseB = await createPurchaseService({
      supplier: supplierAId,
      date: new Date(),
      items: [{ material: materialId, quantity: 5, unitPrice: 100 }],
    });

    // Check if SPECIFIC payment remainder was applied to Purchase B
    const updatedPurchaseB = await Purchase.findById(purchaseB._id);
    assert.strictEqual(updatedPurchaseB.allocatedAmount, 0); // No leakage!
    assert.strictEqual(updatedPurchaseB.paymentStatus, "UNPAID");

    // Reduce Purchase A total to 1 (Test D)
    await updatePurchaseService(purchaseA._id, {
      items: [{ material: materialId, quantity: 0.01, unitPrice: 100 }], // Simulate 1 total
    });
    
    const zeroAllocPayment = await SupplierPayment.findById(specificPayment._id);
    assert.strictEqual(zeroAllocPayment.allocations.length, 1);
    assert.strictEqual(zeroAllocPayment.allocations[0].amount, 1);
    assert.strictEqual(zeroAllocPayment.unallocatedAmount, 799);
    assert.strictEqual(zeroAllocPayment.purchaseId.toString(), purchaseA._id.toString()); // Context preserved
  });

  await t.test("Test B & C: Supplier reassignment with active and voided payment", async (t) => {
    const purchaseC = await createPurchaseService({
      supplier: supplierAId,
      date: new Date(),
      items: [{ material: materialId, quantity: 10, unitPrice: 100 }],
    });

    const paymentC = await createSupplierPaymentService({
      type: "SPECIFIC",
      supplier: supplierAId,
      purchaseId: purchaseC._id,
      amount: 1000,
      date: new Date(),
    });

    // Try reassignment with active payment
    await assert.rejects(
      updatePurchaseService(purchaseC._id, { supplier: supplierBId }),
      /Cannot change supplier after financial history exists for this purchase/
    );

    // Void the payment
    // We need a dummy user ID for voiding
    const dummyUserId = new mongoose.Types.ObjectId();
    await voidSupplierPaymentService(paymentC._id, "Mistake", dummyUserId);

    // Try reassignment again with voided payment
    await assert.rejects(
      updatePurchaseService(purchaseC._id, { supplier: supplierBId }),
      /Cannot change supplier after financial history exists for this purchase/
    );

    // Create Purchase D (no payments)
    const purchaseD = await createPurchaseService({
      supplier: supplierAId,
      date: new Date(),
      items: [{ material: materialId, quantity: 1, unitPrice: 100 }],
    });

    // Reassignment should succeed
    const updatedPurchase2 = await updatePurchaseService(purchaseD._id, { supplier: supplierBId });
    assert.strictEqual(
      updatedPurchase2.supplier._id ? updatedPurchase2.supplier._id.toString() : updatedPurchase2.supplier.toString(),
      supplierBId.toString()
    );
  });

  await t.test("Test E & F: Paid Purchase immutability", async (t) => {
    const purchaseE = await createPurchaseService({
      supplier: supplierAId,
      date: new Date(),
      items: [{ material: materialId, quantity: 10, unitPrice: 100 }], // 1000
    });

    await createSupplierPaymentService({
      type: "SPECIFIC",
      supplier: supplierAId,
      purchaseId: purchaseE._id,
      amount: 1000,
      date: new Date(),
    });

    const paidPurchase = await Purchase.findById(purchaseE._id);
    assert.strictEqual(paidPurchase.paymentStatus, "PAID");

    // Attempt to modify items
    await assert.rejects(
      updatePurchaseService(purchaseE._id, { items: [{ material: materialId, quantity: 5, unitPrice: 100 }] }),
      /Cannot modify items of a fully paid purchase/
    );

    // legitimate partial modification
    const purchaseF = await createPurchaseService({
      supplier: supplierAId,
      date: new Date(),
      items: [{ material: materialId, quantity: 10, unitPrice: 100 }], // 1000
    });

    await createSupplierPaymentService({
      type: "SPECIFIC",
      supplier: supplierAId,
      purchaseId: purchaseF._id,
      amount: 500,
      date: new Date(),
    });

    // Update items to exactly 500
    await updatePurchaseService(purchaseF._id, { items: [{ material: materialId, quantity: 5, unitPrice: 100 }] });
    
    const updatedPurchaseF = await Purchase.findById(purchaseF._id);
    assert.strictEqual(updatedPurchaseF.totalAmount, 500);
    assert.strictEqual(updatedPurchaseF.paymentStatus, "PAID");
  });

  await t.test("Test G & H: Concurrent allocations and reconciliations", async (t) => {
    const purchaseG = await createPurchaseService({
      supplier: supplierAId,
      date: new Date(),
      items: [{ material: materialId, quantity: 10, unitPrice: 100 }], // 1000
    });

    const purchaseH = await createPurchaseService({
      supplier: supplierAId,
      date: new Date(),
      items: [{ material: materialId, quantity: 10, unitPrice: 100 }], // 1000
    });

    const payment = await createSupplierPaymentService({
      type: "GENERAL",
      supplier: supplierAId,
      amount: 1500,
      date: new Date(),
    });

    // Both purchases should consume the general payment automatically during their creation if it existed,
    // but the payment was created AFTER the purchases.
    // So the payment is allocated: 1000 to G, 500 to H.
    const updatedPayment = await SupplierPayment.findById(payment._id);
    assert.strictEqual(updatedPayment.unallocatedAmount, 0);

    // Concurrently reduce both purchases' totals to 200, which will trigger reconcilePurchaseTotal concurrently.
    const results = await Promise.allSettled([
      updatePurchaseService(purchaseG._id, { items: [{ material: materialId, quantity: 2, unitPrice: 100 }] }),
      updatePurchaseService(purchaseH._id, { items: [{ material: materialId, quantity: 2, unitPrice: 100 }] })
    ]);

    // One might succeed and one might get WriteConflict, or both succeed due to session retry inside the transaction.
    // If they succeed, the payment unallocated amount should be correctly updated to 1100.
    
    // Check invariants
    const finalPayment = await SupplierPayment.findById(payment._id);
    const finalAllocated = finalPayment.allocations.reduce((sum, a) => sum + a.amount, 0);
    assert.strictEqual(finalAllocated + finalPayment.unallocatedAmount, finalPayment.amount);
    
    const finalG = await Purchase.findById(purchaseG._id);
    const finalH = await Purchase.findById(purchaseH._id);
    
    assert.ok(finalG.allocatedAmount <= finalG.totalAmount);
    assert.ok(finalH.allocatedAmount <= finalH.totalAmount);
  });

  await t.test("Teardown", async () => {
    await mongoose.disconnect();
  });
});
