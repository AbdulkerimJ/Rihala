import mongoose from "mongoose";
import { EXPENSE_CATEGORIES } from "./constants/expenseCategories.js";

const expenseSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, "Expense category is required"],
      enum: {
        values: EXPENSE_CATEGORIES,
        message: "Invalid expense category",
      },
      trim: true,
    },

    amount: {
      type: Number,
      required: [true, "Expense amount is required"],
      min: [0.01, "Expense amount must be greater than 0"],
    },

    description: {
      type: String,
      trim: true,
    },

    date: {
      type: Date,
      required: [true, "Expense date is required"],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Expense creator is required"],
    },

    createdByName: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: {
        values: ["active", "voided"],
        message: "Status must be either active or voided",
      },
      default: "active",
    },

    voidReason: {
      type: String,
      trim: true,
    },

    voidedAt: {
      type: Date,
    },

    voidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    voidedByName: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;
