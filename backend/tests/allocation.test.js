import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

// A mock version of the models to test the pure logic without connecting to MongoDB
import Purchase from "../src/modules/purchases/purchase.model.js";
import SupplierPayment from "../src/modules/supplierPayments/supplierPayment.model.js";
import * as allocationService from "../src/modules/supplierPayments/allocation.service.js";
import ValidationError from "../src/core/errors/ValidationError.js";

// Basic mocking of Mongoose models for testing allocation engine logic
// This test focuses on the core mathematical allocation logic

test("allocateSpecificPayment correctly allocates amount and updates purchase", async () => {
  const mockPurchaseId = new mongoose.Types.ObjectId();
  const supplierId = new mongoose.Types.ObjectId();
  const mockPurchase = {
    _id: mockPurchaseId,
    supplier: supplierId,
    totalAmount: 10000,
    allocatedAmount: 2000, // Remaining = 8000
    save: async function() {
      this.paymentStatus = allocationService.getPaymentStatus(this.totalAmount, this.allocatedAmount);
    },
  };

  const mockPayment = {
    supplier: supplierId,
    amount: 5000,
    allocations: [],
    save: async function() {
      const totalAllocated = this.allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
      this.unallocatedAmount = this.amount - totalAllocated;
    },
  };

  // Override temporarily
  const originalFindOneAndUpdate = Purchase.findOneAndUpdate;
  const originalFindById = Purchase.findById;
  Purchase.findOneAndUpdate = () => mockPurchase;
  Purchase.findById = () => ({ session: () => mockPurchase });

  try {
    await allocationService.allocateSpecificPayment(mockPayment, mockPurchaseId);
    
    assert.equal(mockPayment.allocations.length, 1);
    assert.equal(mockPayment.allocations[0].amount, 5000);
    assert.equal(mockPayment.allocations[0].purchase.toString(), mockPurchaseId.toString());
    assert.equal(mockPurchase.allocatedAmount, 7000);
    assert.equal(mockPayment.unallocatedAmount, 0);
    assert.equal(mockPurchase.paymentStatus, "PARTIALLY_PAID");
  } finally {
    Purchase.findOneAndUpdate = originalFindOneAndUpdate;
    Purchase.findById = originalFindById;
  }
});

test("allocateSpecificPayment rejects if payment exceeds remaining amount", async () => {
  const mockPurchaseId = new mongoose.Types.ObjectId();
  const supplierId = new mongoose.Types.ObjectId();
  const mockPurchase = {
    _id: mockPurchaseId,
    supplier: supplierId,
    totalAmount: 10000,
    allocatedAmount: 9000, // Remaining = 1000
    save: async () => {},
  };

  const mockPayment = {
    supplier: supplierId,
    amount: 2000, // Exceeds 1000
    allocations: [],
    save: async () => {},
  };

  const originalFindOneAndUpdate = Purchase.findOneAndUpdate;
  Purchase.findOneAndUpdate = () => mockPurchase;

  try {
    await assert.rejects(
      () => allocationService.allocateSpecificPayment(mockPayment, mockPurchaseId),
      ValidationError,
    );
  } finally {
    Purchase.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("allocateSpecificPayment rejects if payment and purchase suppliers do not match", async () => {
  const mockPurchaseId = new mongoose.Types.ObjectId();
  const mockPurchase = {
    _id: mockPurchaseId,
    supplier: "SUPPLIER_A",
    totalAmount: 10000,
    allocatedAmount: 0,
    save: async () => {},
  };

  const mockPayment = {
    supplier: "SUPPLIER_B",
    amount: 5000,
    allocations: [],
    save: async () => {},
  };

  const originalFindOneAndUpdate = Purchase.findOneAndUpdate;
  Purchase.findOneAndUpdate = () => {
    const p = { ...mockPurchase };
    p.session = () => p;
    return p;
  };

  try {
    await assert.rejects(
      () => allocationService.allocateSpecificPayment(mockPayment, mockPurchaseId),
      ValidationError,
      /Supplier payment cannot be allocated to a purchase belonging to another supplier/
    );
  } finally {
    Purchase.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("allocateGeneralPayment distributes across multiple outstanding purchases", async () => {
  const supplierId = new mongoose.Types.ObjectId();
  
  const mockPurchases = [
    { _id: "P1", totalAmount: 4000, allocatedAmount: 0, save: async function() { this.paymentStatus = allocationService.getPaymentStatus(this.totalAmount, this.allocatedAmount); } },
    { _id: "P2", totalAmount: 6000, allocatedAmount: 0, save: async function() { this.paymentStatus = allocationService.getPaymentStatus(this.totalAmount, this.allocatedAmount); } },
    { _id: "P3", totalAmount: 10000, allocatedAmount: 0, save: async function() { this.paymentStatus = allocationService.getPaymentStatus(this.totalAmount, this.allocatedAmount); } },
  ];

  const mockPayment = {
    amount: 15000,
    supplier: supplierId,
    allocations: [],
    save: async function() {
      const totalAllocated = this.allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
      this.unallocatedAmount = this.amount - totalAllocated;
    },
  };

  const originalFind = Purchase.find;
  const originalFindOneAndUpdate = Purchase.findOneAndUpdate;
  const originalFindById = Purchase.findById;

  Purchase.find = () => ({
    session: () => ({ sort: () => mockPurchases })
  });

  Purchase.findOneAndUpdate = ({ _id }) => mockPurchases.find(p => p._id === _id);
  Purchase.findById = (id) => ({ session: () => mockPurchases.find(p => p._id === id) });

  try {
    await allocationService.allocateGeneralPayment(mockPayment);
    
    assert.equal(mockPayment.allocations.length, 3);
    assert.equal(mockPayment.allocations[0].amount, 4000); // P1 fully paid
    assert.equal(mockPayment.allocations[1].amount, 6000); // P2 fully paid
    assert.equal(mockPayment.allocations[2].amount, 5000); // P3 partially paid
    
    assert.equal(mockPayment.unallocatedAmount, 0); // 15000 fully used
    
    assert.equal(mockPurchases[0].allocatedAmount, 4000);
    assert.equal(mockPurchases[0].paymentStatus, "PAID");
    
    assert.equal(mockPurchases[1].allocatedAmount, 6000);
    assert.equal(mockPurchases[1].paymentStatus, "PAID");
    
    assert.equal(mockPurchases[2].allocatedAmount, 5000);
    assert.equal(mockPurchases[2].paymentStatus, "PARTIALLY_PAID");
  } finally {
    Purchase.find = originalFind;
    Purchase.findOneAndUpdate = originalFindOneAndUpdate;
    Purchase.findById = originalFindById;
  }
});

test("allocateGeneralPayment handles excess amount as supplier credit", async () => {
  const supplierId = new mongoose.Types.ObjectId();
  
  const mockPurchases = [
    { _id: "P1", totalAmount: 4000, allocatedAmount: 0, save: async function() {} },
    { _id: "P2", totalAmount: 6000, allocatedAmount: 0, save: async function() {} },
  ];

  const mockPayment = {
    amount: 15000,
    supplier: supplierId,
    allocations: [],
    save: async function() {
      const totalAllocated = this.allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
      this.unallocatedAmount = this.amount - totalAllocated;
    },
  };

  const originalFind = Purchase.find;
  const originalFindOneAndUpdate = Purchase.findOneAndUpdate;
  const originalFindById = Purchase.findById;

  Purchase.find = () => ({
    session: () => ({ sort: () => mockPurchases })
  });

  Purchase.findOneAndUpdate = ({ _id }) => mockPurchases.find(p => p._id === _id);
  Purchase.findById = (id) => ({ session: () => mockPurchases.find(p => p._id === id) });

  try {
    await allocationService.allocateGeneralPayment(mockPayment);
    
    assert.equal(mockPayment.allocations.length, 2);
    assert.equal(mockPayment.unallocatedAmount, 5000); // 15000 - 10000 = 5000 credit
  } finally {
    Purchase.find = originalFind;
    Purchase.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("reconcilePaymentAmount decreases allocation properly", async () => {
  const mockPurchases = [
    { _id: "P1", totalAmount: 6000, allocatedAmount: 6000, save: async function() {} },
    { _id: "P2", totalAmount: 4000, allocatedAmount: 4000, save: async function() {} },
  ];

  const mockPayment = {
    amount: 10000,
    allocations: [
      { purchase: "P1", amount: 6000 },
      { purchase: "P2", amount: 4000 },
    ],
    save: async function() {
      const totalAllocated = this.allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
      this.unallocatedAmount = this.amount - totalAllocated;
    },
  };

  const originalFindById = Purchase.findById;
  Purchase.findById = (id) => ({
    session: () => mockPurchases.find(p => p._id === id),
  });

  try {
    await allocationService.reconcilePaymentAmount(mockPayment, 7000);
    
    // It should reduce from the end (P2 first)
    assert.equal(mockPayment.amount, 7000);
    assert.equal(mockPayment.allocations.length, 2);
    assert.equal(mockPayment.allocations[0].amount, 6000);
    assert.equal(mockPayment.allocations[1].amount, 1000); // reduced by 3000
    
    assert.equal(mockPurchases[0].allocatedAmount, 6000);
    assert.equal(mockPurchases[1].allocatedAmount, 1000); // updated
    
  } finally {
    Purchase.findById = originalFindById;
  }
});

test("reconcilePaymentAmount increases GENERAL payment amount properly", async () => {
  const supplierId = new mongoose.Types.ObjectId();
  const mockPurchases = [
    { _id: "P1", totalAmount: 6000, allocatedAmount: 6000, paymentStatus: "PAID", save: async function() {} },
    { _id: "P2", totalAmount: 10000, allocatedAmount: 4000, paymentStatus: "PARTIALLY_PAID", save: async function() {} },
  ];

  const mockPayment = {
    type: "GENERAL",
    supplier: supplierId,
    amount: 10000,
    allocations: [
      { purchase: "P1", amount: 6000 },
      { purchase: "P2", amount: 4000 },
    ],
    save: async function() {
      const totalAllocated = this.allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
      this.unallocatedAmount = this.amount - totalAllocated;
    },
  };

  const originalFindById = Purchase.findById;
  const originalFind = Purchase.find;
  const originalFindOneAndUpdate = Purchase.findOneAndUpdate;
  
  Purchase.findById = (id) => ({
    session: () => mockPurchases.find(p => p._id === id),
  });
  
  Purchase.find = () => ({
    session: () => ({ sort: () => [mockPurchases[1]] })
  });

  Purchase.findOneAndUpdate = ({ _id }) => mockPurchases.find(p => p._id === _id);

  try {
    await allocationService.reconcilePaymentAmount(mockPayment, 15000); // +5000
    
    assert.equal(mockPayment.amount, 15000);
    assert.equal(mockPayment.allocations.length, 2);
    assert.equal(mockPayment.allocations[0].amount, 6000);
    assert.equal(mockPayment.allocations[1].amount, 9000); // 4000 + 5000 auto-allocated
    
    assert.equal(mockPurchases[1].allocatedAmount, 9000); // updated
    
  } finally {
    Purchase.findById = originalFindById;
    Purchase.find = originalFind;
    Purchase.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("reconcilePurchaseTotal reduces allocations if purchase total drops below allocated", async () => {
  const mockPurchaseId = new mongoose.Types.ObjectId();
  const mockPurchase = {
    _id: mockPurchaseId,
    totalAmount: 7000, // Dropped from 10000
    allocatedAmount: 10000,
    save: async function() {
      this.paymentStatus = allocationService.getPaymentStatus(this.totalAmount, this.allocatedAmount);
    },
  };

  const mockPayment1 = {
    _id: "PAY1",
    amount: 6000,
    unallocatedAmount: 0,
    allocations: [{ purchase: mockPurchaseId, amount: 6000 }],
    save: async function() {
      const totalAllocated = this.allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
      this.unallocatedAmount = this.amount - totalAllocated;
    },
  };
  
  const mockPayment2 = {
    _id: "PAY2",
    amount: 4000,
    allocations: [{ purchase: mockPurchaseId, amount: 4000 }],
    save: async function() {
      const totalAllocated = this.allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
      this.unallocatedAmount = this.amount - totalAllocated;
    },
  };

  const originalFindById = Purchase.findById;
  const originalFindOneAndUpdate = Purchase.findOneAndUpdate;
  const originalFind = SupplierPayment.find;
  
  Purchase.findById = (id) => {
    mockPurchase.session = () => mockPurchase;
    return mockPurchase;
  };

  Purchase.findOneAndUpdate = (query, update, options) => {
    return mockPurchase; // We mock it to just return the purchase
  };
  
  SupplierPayment.find = () => ({
    session: () => ({ sort: () => [mockPayment2, mockPayment1] }) // Newest first (PAY2)
  });

  try {
    await allocationService.reconcilePurchaseTotal(mockPurchaseId);
    
    // We needed to reduce by 3000. It should come entirely out of PAY2.
    assert.equal(mockPurchase.allocatedAmount, 7000);
    
    assert.equal(mockPayment2.allocations.length, 1);
    assert.equal(mockPayment2.allocations[0].amount, 1000); // 4000 - 3000
    assert.equal(mockPayment2.unallocatedAmount, 3000); // 3000 returned as credit
    
    assert.equal(mockPayment1.allocations[0].amount, 6000); // untouched
    assert.equal(mockPayment1.unallocatedAmount, 0);
    
  } finally {
    Purchase.findById = originalFindById;
    Purchase.findOneAndUpdate = originalFindOneAndUpdate;
    SupplierPayment.find = originalFind;
  }
});

test('reconcilePaymentAmount throws ValidationError if SPECIFIC payment is increased beyond purchase remaining amount', async () => {
  const supplierId = new mongoose.Types.ObjectId();
  const mockPurchases = [
    { _id: 'P1', totalAmount: 6000, allocatedAmount: 6000, save: async function() {} },
  ];

  const mockPayment = {
    type: 'SPECIFIC',
    supplier: supplierId,
    amount: 6000,
    allocations: [
      { purchase: 'P1', amount: 6000 },
    ],
    save: async function() {
      const totalAllocated = this.allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
      this.unallocatedAmount = this.amount - totalAllocated;
    },
  };

  const originalFindById = Purchase.findById;
  const originalFindOneAndUpdate = Purchase.findOneAndUpdate;
  Purchase.findById = (id) => ({
    session: () => mockPurchases.find(p => p._id === id),
  });
  Purchase.findOneAndUpdate = ({ _id }) => mockPurchases.find(p => p._id === _id);

  try {
    await assert.rejects(
      () => allocationService.reconcilePaymentAmount(mockPayment, 7000), // Increase by 1000
      ValidationError,
      /Payment amount exceeds purchase remaining amount by 1000/
    );
  } finally {
    Purchase.findById = originalFindById;
    Purchase.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test('applyCreditToPurchase handles multiple credit payments oldest-first', async () => {
  const mockPurchaseId = new mongoose.Types.ObjectId();
  const mockPurchase = {
    _id: mockPurchaseId,
    supplier: 'SUPP1',
    totalAmount: 10000,
    allocatedAmount: 0,
    save: async function() {
      this.paymentStatus = allocationService.getPaymentStatus(this.totalAmount, this.allocatedAmount);
    },
  };

  const mockPayments = [
    { _id: 'PAY1', unallocatedAmount: 3000, allocations: [], save: async function() {
      const totalAllocated = this.allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
      this.unallocatedAmount = this.amount - totalAllocated;
    }, amount: 3000 },
    { _id: 'PAY2', unallocatedAmount: 5000, allocations: [], save: async function() {
      const totalAllocated = this.allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
      this.unallocatedAmount = this.amount - totalAllocated;
    }, amount: 5000 },
    { _id: 'PAY3', unallocatedAmount: 4000, allocations: [], save: async function() {
      const totalAllocated = this.allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
      this.unallocatedAmount = this.amount - totalAllocated;
    }, amount: 4000 }
  ];

  const originalFindOneAndUpdatePurchase = Purchase.findOneAndUpdate;
  const originalFindById = Purchase.findById;
  const originalFind = SupplierPayment.find;
  const originalFindOneAndUpdatePayment = SupplierPayment.findOneAndUpdate;
  
  Purchase.findOneAndUpdate = () => mockPurchase;
  Purchase.findById = () => ({ session: () => mockPurchase });
  SupplierPayment.find = () => ({
    session: () => ({ sort: () => mockPayments }) // Sorted oldest first
  });
  SupplierPayment.findOneAndUpdate = ({ _id }) => mockPayments.find(p => p._id === _id);

  try {
    await allocationService.applyCreditToPurchase(mockPurchaseId);

    assert.equal(mockPurchase.allocatedAmount, 10000);
    assert.equal(mockPurchase.paymentStatus, 'PAID');
    
    assert.equal(mockPayments[0].allocations[0].amount, 3000); // Fully consumed
    assert.equal(mockPayments[0].unallocatedAmount, 0);
    
    assert.equal(mockPayments[1].allocations[0].amount, 5000); // Fully consumed
    assert.equal(mockPayments[1].unallocatedAmount, 0);
    
    assert.equal(mockPayments[2].allocations[0].amount, 2000); // Partially consumed
    assert.equal(mockPayments[2].unallocatedAmount, 2000);
  } finally {
    Purchase.findOneAndUpdate = originalFindOneAndUpdatePurchase;
    Purchase.findById = originalFindById;
    SupplierPayment.find = originalFind;
    SupplierPayment.findOneAndUpdate = originalFindOneAndUpdatePayment;
  }
});

test('reconcilePurchaseTotal when purchase total increases does not automatically consume credit', async () => {
  const mockPurchaseId = new mongoose.Types.ObjectId();
  const mockPurchase = {
    _id: mockPurchaseId,
    totalAmount: 12000, // Increased from 10000
    allocatedAmount: 10000,
    save: async function() {
      this.paymentStatus = allocationService.getPaymentStatus(this.totalAmount, this.allocatedAmount);
    },
  };

  const originalFindById = Purchase.findById;
  const originalFindOneAndUpdate = Purchase.findOneAndUpdate;
  Purchase.findById = () => ({ session: () => mockPurchase });
  Purchase.findOneAndUpdate = () => mockPurchase;

  try {
    // reconcilePurchaseTotal should just update paymentStatus to PARTIALLY_PAID
    await allocationService.reconcilePurchaseTotal(mockPurchaseId);
    
    assert.equal(mockPurchase.allocatedAmount, 10000); // Unchanged
    assert.equal(mockPurchase.paymentStatus, 'PARTIALLY_PAID');
  } finally {
    Purchase.findById = originalFindById;
    Purchase.findOneAndUpdate = originalFindOneAndUpdate;
  }
});
