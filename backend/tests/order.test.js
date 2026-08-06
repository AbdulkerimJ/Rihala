import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import Order from "../src/modules/orders/order.model.js";
import Customer from "../src/modules/customers/customer.model.js";
import {
  isValidStatusTransition,
  createOrderService,
  updateOrderService,
} from "../src/modules/orders/order.service.js";
import {
  createOrderSchema,
  updateOrderSchema,
} from "../src/modules/orders/order.validation.js";
import ValidationError from "../src/core/errors/ValidationError.js";
import NotFoundError from "../src/core/errors/NotFoundError.js";
import ConflictError from "../src/core/errors/ConflictError.js";

const mockFindById = (Model, obj) => {
  const original = Model.findById;
  Model.findById = (id) => ({
    populate: async () => obj,
    session: () => obj,
    ...obj,
  });
  return original;
};

test("allows the expected status progression for orders", () => {
  assert.equal(isValidStatusTransition("pending", "in_progress"), true);
  assert.equal(isValidStatusTransition("in_progress", "ready"), true);
  assert.equal(isValidStatusTransition("ready", "completed"), true);
  assert.equal(isValidStatusTransition("pending", "cancelled"), true);
  assert.equal(isValidStatusTransition("in_progress", "cancelled"), true);
});

test("rejects invalid order status transitions", () => {
  assert.equal(isValidStatusTransition("pending", "completed"), false);
  assert.equal(isValidStatusTransition("ready", "cancelled"), false);
  assert.equal(isValidStatusTransition("completed", "pending"), false);
  assert.equal(isValidStatusTransition("cancelled", "pending"), false);
});

test("createOrderSchema rejects unsupported internal fields", () => {
  const result = createOrderSchema.safeParse({
    customer: "507f1f77bcf86cd799439011",
    createdBy: "507f1f77bcf86cd799439012",
    orderNumber: "ORD-9999",
    items: [{ description: "Table", quantity: 1, unit: "piece" }],
    agreedAmount: 1200,
    expectedCompletionDate: "2026-10-10T00:00:00.000Z",
  });

  assert.equal(result.success, false);
});

test("createOrderService handles snapshots, order number, and defaults", async () => {
  const customerId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();
  
  const mockCustomer = {
    _id: customerId,
    name: "Ahmed Ali",
    phone: "0911000000",
    status: "active",
  };

  const originalCustomerFindById = Customer.findById;
  Customer.findById = () => mockCustomer;

  const originalCount = Order.countDocuments;
  Order.countDocuments = async () => 5; // Will generate ORD-1006

  const originalFindOne = Order.findOne;
  Order.findOne = async () => null; // No conflict

  let createdOrder = null;
  const originalCreate = Order.create;
  Order.create = async (data) => {
    createdOrder = { ...data, _id: new mongoose.Types.ObjectId(), populate: async () => createdOrder };
    return createdOrder;
  };

  try {
    const order = await createOrderService({
      customer: customerId,
      items: [{ description: "Sofa", quantity: 2, unit: "piece" }],
      agreedAmount: 5000,
      expectedCompletionDate: new Date(),
    }, userId);

    assert.equal(order.orderNumber, "ORD-1006");
    assert.equal(order.customerName, "Ahmed Ali");
    assert.equal(order.customerPhone, "0911000000");
    assert.equal(order.status, "pending");
    assert.equal(order.statusHistory.length, 1);
    assert.equal(order.statusHistory[0].status, "pending");
    assert.equal(order.statusHistory[0].changedBy, userId);
    assert.ok(order.date instanceof Date); // Defaulted to today
  } finally {
    Customer.findById = originalCustomerFindById;
    Order.countDocuments = originalCount;
    Order.findOne = originalFindOne;
    Order.create = originalCreate;
  }
});

test("createOrderService blocks inactive customers", async () => {
  const originalCustomerFindById = Customer.findById;
  Customer.findById = () => ({ status: "inactive" });

  try {
    await assert.rejects(
      () => createOrderService({ customer: new mongoose.Types.ObjectId() }, new mongoose.Types.ObjectId()),
      ValidationError
    );
  } finally {
    Customer.findById = originalCustomerFindById;
  }
});

test("updateOrderService blocks editing completed or cancelled orders", async () => {
  const mockOrder = {
    _id: new mongoose.Types.ObjectId(),
    status: "completed", // Terminal state
  };

  const originalFindById = Order.findById;
  Order.findById = () => mockOrder;

  try {
    await assert.rejects(
      () => updateOrderService(mockOrder._id, { notes: "New note" }, new mongoose.Types.ObjectId()),
      ValidationError
    );
  } finally {
    Order.findById = originalFindById;
  }
});

test("updateOrderService properly records status history and validates transition", async () => {
  let saved = false;
  const userId = new mongoose.Types.ObjectId();
  const mockOrder = {
    _id: new mongoose.Types.ObjectId(),
    status: "pending",
    statusHistory: [{ status: "pending", changedBy: new mongoose.Types.ObjectId() }],
    save: async () => { saved = true; },
    populate: async () => mockOrder,
  };

  const originalFindById = Order.findById;
  Order.findById = () => mockOrder;

  try {
    await updateOrderService(mockOrder._id, { status: "in_progress" }, userId);
    
    assert.equal(saved, true);
    assert.equal(mockOrder.status, "in_progress");
    assert.equal(mockOrder.statusHistory.length, 2);
    assert.equal(mockOrder.statusHistory[1].status, "in_progress");
    assert.equal(mockOrder.statusHistory[1].changedBy, userId);
  } finally {
    Order.findById = originalFindById;
  }
});

test("updateOrderService updates customer snapshots when customer changes", async () => {
  let saved = false;
  const mockOrder = {
    _id: new mongoose.Types.ObjectId(),
    customer: new mongoose.Types.ObjectId(),
    customerName: "Old Name",
    customerPhone: "123",
    status: "pending",
    save: async () => { saved = true; },
    populate: async () => mockOrder,
  };

  const newCustomerId = new mongoose.Types.ObjectId();
  const mockCustomer = {
    _id: newCustomerId,
    name: "New Name",
    phone: "999",
    status: "active",
  };

  const originalOrderFindById = Order.findById;
  Order.findById = () => mockOrder;
  
  const originalCustomerFindById = Customer.findById;
  Customer.findById = () => mockCustomer;

  try {
    await updateOrderService(mockOrder._id, { customer: newCustomerId }, new mongoose.Types.ObjectId());
    
    assert.equal(saved, true);
    assert.equal(mockOrder.customerName, "New Name");
    assert.equal(mockOrder.customerPhone, "999");
    assert.equal(mockOrder.customer.toString(), newCustomerId.toString());
  } finally {
    Order.findById = originalOrderFindById;
    Customer.findById = originalCustomerFindById;
  }
});
