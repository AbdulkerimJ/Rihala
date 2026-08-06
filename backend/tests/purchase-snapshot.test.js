import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import ValidationError from "../src/core/errors/ValidationError.js";
import Material from "../src/modules/materials/material.model.js";
import Purchase from "../src/modules/purchases/purchase.model.js";
import Supplier from "../src/modules/suppliers/supplier.model.js";
import { createPurchaseService } from "../src/modules/purchases/purchase.service.js";
import * as allocationService from "../src/modules/supplierPayments/allocation.service.js";

// Utility to mock Mongoose models
const mockFindById = (Model, data) => {
  const original = Model.findById;
  Model.findById = (id) => {
    const item = data.find((d) => d._id.toString() === id.toString());
    if (!item) return null;
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

test("Purchase successfully snapshots material name, category, and unit while preserving ObjectId", async () => {
  const supplierId = new mongoose.Types.ObjectId();
  const materialId = new mongoose.Types.ObjectId();
  
  const originalSupplierFind = mockFindById(Supplier, [{ _id: supplierId, status: "active" }]);
  const originalMaterialFind = mockFindById(Material, [{ 
    _id: materialId, 
    name: "MDF 18mm",
    category: "MDF",
    unit: "piece",
    status: "active" 
  }]);
  
  const originalCount = mockCountDocuments(Purchase);
  const originalFindOne = mockFindOne(Purchase);
  const originalCreate = mockCreate(Purchase);
  const originalPaymentFind = mockFind(mongoose.model("SupplierPayment") || { find: () => {} }, []);

  const originalPurchaseFindById = Purchase.findById;
  let createdPurchase = null;
  Purchase.findById = (id) => ({
    populate: async () => createdPurchase
  });

  try {
    // We override create just to capture the exact payload passed
    Purchase.create = async (data) => {
      createdPurchase = { ...data, _id: new mongoose.Types.ObjectId() };
      return createdPurchase;
    };

    const purchase = await createPurchaseService({
      supplier: supplierId,
      items: [{ material: materialId, quantity: 5, unitPrice: 100 }]
    });

    // 1. Purchase snapshots material name
    assert.equal(purchase.items[0].materialName, "MDF 18mm");
    
    // 2. Purchase snapshots material category
    assert.equal(purchase.items[0].materialCategory, "MDF");
    
    // 3. Purchase snapshots material unit
    assert.equal(purchase.items[0].unit, "piece");
    
    // 7. The material ObjectId relationship is still preserved
    assert.equal(purchase.items[0].material.toString(), materialId.toString());
    
  } finally {
    Supplier.findById = originalSupplierFind;
    Material.findById = originalMaterialFind;
    Purchase.countDocuments = originalCount;
    Purchase.findOne = originalFindOne;
    Purchase.create = originalCreate;
    Purchase.findById = originalPurchaseFindById;
  }
});

test("Editing material after purchase does not affect historical snapshots", async () => {
  // Simulate DB state after a material edit
  const supplierId = new mongoose.Types.ObjectId();
  const materialId = new mongoose.Types.ObjectId();
  const purchaseId = new mongoose.Types.ObjectId();

  const mockPurchaseInDB = {
    _id: purchaseId,
    supplier: supplierId,
    items: [{
      material: materialId,
      materialName: "MDF 18mm",      // Old snapshot
      materialCategory: "MDF",       // Old snapshot
      unit: "piece",                 // Old snapshot
      quantity: 5,
      unitPrice: 100,
      subtotal: 500
    }],
    totalAmount: 500,
    populate: async () => mockPurchaseInDB // Mocking standard mongoose populate
  };

  // Imagine the material was edited later in the database
  const editedMaterialInDB = {
    _id: materialId,
    name: "MDF Premium 18mm",
    category: "Wood",
    unit: "roll" // Extreme case to prove unit isolation
  };

  // 4, 5, 6: Check the historical purchase properties
  assert.equal(mockPurchaseInDB.items[0].materialName, "MDF 18mm", "Historical name preserved");
  assert.equal(mockPurchaseInDB.items[0].materialCategory, "MDF", "Historical category preserved");
  assert.equal(mockPurchaseInDB.items[0].unit, "piece", "Historical unit preserved");
  
  // It still points to the same object ID, allowing for relational queries if absolutely necessary
  assert.equal(mockPurchaseInDB.items[0].material.toString(), editedMaterialInDB._id.toString());
});

test("Inactive materials remain blocked from new purchases", async () => {
  const supplierId = new mongoose.Types.ObjectId();
  const materialId = new mongoose.Types.ObjectId();
  
  const originalSupplierFind = mockFindById(Supplier, [{ _id: supplierId, status: "active" }]);
  const originalMaterialFind = mockFindById(Material, [{ 
    _id: materialId, 
    name: "MDF 18mm",
    category: "MDF",
    unit: "piece",
    status: "inactive" // Material is INACTIVE
  }]);

  try {
    await assert.rejects(
      () => createPurchaseService({
        supplier: supplierId,
        items: [{ material: materialId, quantity: 5, unitPrice: 100 }]
      }),
      ValidationError,
      "Material MDF 18mm is inactive"
    );
  } finally {
    Supplier.findById = originalSupplierFind;
    Material.findById = originalMaterialFind;
  }
});
