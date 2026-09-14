import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import ValidationError from "../src/core/errors/ValidationError.js";
import Supplier from "../src/modules/suppliers/supplier.model.js";
import Material from "../src/modules/materials/material.model.js";
import Purchase from "../src/modules/purchases/purchase.model.js";
import SupplierPayment from "../src/modules/supplierPayments/supplierPayment.model.js";
import { createPurchaseService, getPurchaseByIdService } from "../src/modules/purchases/purchase.service.js";
import { createSupplierPaymentService, getSupplierPaymentByIdService } from "../src/modules/supplierPayments/supplierPayment.service.js";

// Utility to mock Mongoose findById
const mockFindById = (Model, data) => {
  const original = Model.findById;
  Model.findById = (id) => {
    const item = data.find((d) => d._id.toString() === id.toString());
    if (!item) return null;
    
    // We only attach .populate if it exists on the data, otherwise return plain object
    return {
      ...item,
      populate: async () => item,
    };
  };
  return original;
};

const mockCreate = (Model) => {
  const original = Model.create;
  Model.create = async (data) => ({ ...data, _id: new mongoose.Types.ObjectId() });
  return original;
};

const mockCountDocuments = (Model) => {
  const original = Model.countDocuments;
  Model.countDocuments = async () => 1;
  return original;
};

const mockFindOne = (Model) => {
  const original = Model.findOne;
  Model.findOne = async () => null;
  return original;
};

const mockFind = (Model, data = []) => {
  const original = Model.find;
  Model.find = () => ({
    sort: () => data,
  });
  return original;
};

// ----------------------------------------
// Tests
// ----------------------------------------

test("Active supplier can be used to create a purchase", async () => {
  const supplierId = new mongoose.Types.ObjectId();
  const materialId = new mongoose.Types.ObjectId();
  
  const originalSupplierFind = mockFindById(Supplier, [{ _id: supplierId, status: "active" }]);
  const originalMaterialFind = mockFindById(Material, [{ _id: materialId, status: "active", unit: "kg" }]);
  const originalCount = mockCountDocuments(Purchase);
  const originalFindOne = mockFindOne(Purchase);
  const originalCreate = mockCreate(Purchase);
  const originalPaymentFind = mockFind(SupplierPayment, []);
  
  const originalPurchaseFindById = Purchase.findById;
  Purchase.findById = () => ({
    populate: async () => ({
      supplier: supplierId,
      totalAmount: 500
    })
  });

  try {
    const purchase = await createPurchaseService({
      supplier: supplierId,
      items: [{ material: materialId, quantity: 10, unitPrice: 50 }]
    });

    assert.equal(purchase.supplier.toString(), supplierId.toString());
    assert.equal(purchase.totalAmount, 500);
  } finally {
    Supplier.findById = originalSupplierFind;
    Material.findById = originalMaterialFind;
    Purchase.countDocuments = originalCount;
    Purchase.findOne = originalFindOne;
    Purchase.create = originalCreate;
    SupplierPayment.find = originalPaymentFind;
    Purchase.findById = originalPurchaseFindById;
  }
});

test("Inactive supplier cannot be used to create a purchase", async () => {
  const supplierId = new mongoose.Types.ObjectId();
  
  const originalSupplierFind = mockFindById(Supplier, [{ _id: supplierId, status: "inactive" }]);

  try {
    await assert.rejects(
      () => createPurchaseService({
        supplier: supplierId,
        items: []
      }),
      ValidationError,
      "Cannot create purchase for an inactive supplier"
    );
  } finally {
    Supplier.findById = originalSupplierFind;
  }
});

test("Active supplier can receive a supplier payment", async () => {
  const supplierId = new mongoose.Types.ObjectId();
  
  const originalSupplierFind = mockFindById(Supplier, [{ _id: supplierId, status: "active" }]);
  const originalCount = mockCountDocuments(SupplierPayment);
  const originalFindOne = mockFindOne(SupplierPayment);
  
  const originalPurchaseFind = mockFind(Purchase, []);
  
  // Mock save method for Mongoose model
  const originalSave = SupplierPayment.prototype.save;
  SupplierPayment.prototype.save = async function() { return this; };
  
  const mockPaymentId = new mongoose.Types.ObjectId();
  
  // Override findById for the final return
  const originalPaymentFindById = SupplierPayment.findById;
  SupplierPayment.findById = () => ({
    populate: async () => ({
      _id: mockPaymentId,
      supplier: supplierId,
      amount: 5000,
      type: "GENERAL"
    })
  });

  try {
    const payment = await createSupplierPaymentService({
      supplier: supplierId,
      amount: 5000,
      type: "GENERAL",
      paymentDate: new Date()
    });

    assert.equal(payment.amount, 5000);
  } finally {
    Supplier.findById = originalSupplierFind;
    SupplierPayment.countDocuments = originalCount;
    SupplierPayment.findOne = originalFindOne;
    Purchase.find = originalPurchaseFind;
    SupplierPayment.prototype.save = originalSave;
    SupplierPayment.findById = originalPaymentFindById;
  }
});

test("Inactive supplier cannot receive a new supplier payment", async () => {
  const supplierId = new mongoose.Types.ObjectId();
  
  const originalSupplierFind = mockFindById(Supplier, [{ _id: supplierId, status: "inactive" }]);

  try {
    await assert.rejects(
      () => createSupplierPaymentService({
        supplier: supplierId,
        amount: 5000,
        type: "GENERAL",
        paymentDate: new Date()
      }),
      ValidationError,
      "Cannot create payment for an inactive supplier"
    );
  } finally {
    Supplier.findById = originalSupplierFind;
  }
});

test("Existing purchases/payments for an inactive supplier remain accessible", async () => {
  const purchaseId = new mongoose.Types.ObjectId();
  const paymentId = new mongoose.Types.ObjectId();
  
  const originalPurchaseFind = mockFindById(Purchase, [{ _id: purchaseId, totalAmount: 1000 }]);
  const originalPaymentFind = mockFindById(SupplierPayment, [{ _id: paymentId, amount: 5000 }]);

  try {
    const purchase = await getPurchaseByIdService(purchaseId);
    assert.equal(purchase.totalAmount, 1000);
    
    const payment = await getSupplierPaymentByIdService(paymentId);
    assert.equal(payment.amount, 5000);
  } finally {
    Purchase.findById = originalPurchaseFind;
    SupplierPayment.findById = originalPaymentFind;
  }
});
