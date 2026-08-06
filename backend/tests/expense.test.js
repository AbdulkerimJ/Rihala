import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import {
  createExpenseService,
  getExpensesService,
  getExpenseByIdService,
  updateExpenseService,
  voidExpenseService,
} from "../src/modules/expenses/expense.service.js";

import Expense from "../src/modules/expenses/expense.model.js";
import User from "../src/modules/users/user.model.js";
import ValidationError from "../src/core/errors/ValidationError.js";

test("Expenses module test suite", async (t) => {
  await t.test("Setup database connection", async () => {
    await mongoose.connect("mongodb://127.0.0.1:27017/rihala_test_expenses");
    await Expense.createCollection();
    await User.createCollection();
  });

  const setupUser = async () => {
    await User.deleteMany({});
    const user = await User.create({
      name: "Test User",
      email: "test.expenses@rihala.local",
      password: "password123",
      role: "admin",
      status: "active"
    });
    return user._id;
  };

  await t.test("Valid expense creation succeeds and protects internal fields", async () => {
    await Expense.deleteMany({});
    await User.deleteMany({});
    
    const userId = await setupUser();

    const expense = await createExpenseService({
      category: "Transport",
      amount: 50,
      description: "Gas for delivery",
      date: new Date(),
      status: "voided", 
    }, userId);

    assert.equal(expense.category, "Transport");
    assert.equal(expense.amount, 50);
    assert.equal(expense.createdBy._id.toString(), userId.toString());
    
    // Status should be active despite the attempt to inject voided
    assert.equal(expense.status, "active");
  });

  await t.test("Update successfully changes non-financial fields on active expense", async () => {
    await Expense.deleteMany({});
    const userId = await setupUser();

    const expense = await createExpenseService({
      category: "Maintenance",
      amount: 100,
      description: "Oil change",
      date: new Date(),
    }, userId);

    const updated = await updateExpenseService(expense._id, {
      category: "Transport",
      description: "Wrong category initially",
    });

    assert.equal(updated.category, "Transport");
    assert.equal(updated.description, "Wrong category initially");
    assert.equal(updated.amount, 100); // Unchanged
  });

  await t.test("Active expense can be voided successfully", async () => {
    await Expense.deleteMany({});
    const userId = await setupUser();

    const expense = await createExpenseService({
      category: "Other",
      amount: 5000,
      date: new Date(),
    }, userId);

    const voided = await voidExpenseService(expense._id, "Incorrect amount", userId);

    assert.equal(voided.status, "voided");
    assert.equal(voided.voidReason, "Incorrect amount");
    assert.equal(voided.voidedBy._id.toString(), userId.toString());
    assert.ok(voided.voidedAt instanceof Date);
    
    // Financial data remains intact
    assert.equal(voided.amount, 5000);
    assert.equal(voided.category, "Other");
  });

  await t.test("Voided expense cannot be voided again", async () => {
    await Expense.deleteMany({});
    const userId = await setupUser();

    const expense = await createExpenseService({
      category: "Other",
      amount: 5000,
      date: new Date(),
    }, userId);

    await voidExpenseService(expense._id, "Reason 1", userId);

    await assert.rejects(
      () => voidExpenseService(expense._id, "Reason 2", userId),
      ValidationError,
      /Expense is already voided/
    );
  });

  await t.test("Voided expense cannot be updated", async () => {
    await Expense.deleteMany({});
    const userId = await setupUser();

    const expense = await createExpenseService({
      category: "Other",
      amount: 5000,
      date: new Date(),
    }, userId);

    await voidExpenseService(expense._id, "Reason 1", userId);

    await assert.rejects(
      () => updateExpenseService(expense._id, { description: "Attempt update" }),
      ValidationError,
      /Cannot update a voided expense/
    );
  });

  await t.test("Queries default to active expenses unless explicitly requested", async () => {
    await Expense.deleteMany({});
    const userId = await setupUser();

    await createExpenseService({ category: "Transport", amount: 10, date: new Date() }, userId);
    const expToVoid = await createExpenseService({ category: "Transport", amount: 20, date: new Date() }, userId);
    await createExpenseService({ category: "Transport", amount: 30, date: new Date() }, userId);

    await voidExpenseService(expToVoid._id, "Test", userId);

    // Default query
    const defaultRes = await getExpensesService({});
    assert.equal(defaultRes.data.length, 2);
    assert.ok(defaultRes.data.every(e => e.status === "active"));

    // Explicit void query
    const voidedRes = await getExpensesService({ status: "voided" });
    assert.equal(voidedRes.data.length, 1);
    assert.equal(voidedRes.data[0].status, "voided");
  });

  await t.test("Teardown database connection", async () => {
    await mongoose.disconnect();
  });
});
