import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      min: 0,
    },
    expenseDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Expense = mongoose.model("Expense", expenseSchema);
