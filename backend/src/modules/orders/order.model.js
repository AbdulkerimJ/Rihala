import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Order creator is required"],
    },

    description: {
      type: String,
      required: [true, "Order description is required"],
      trim: true,
      minlength: [1, "Order description cannot be empty"],
    },

    agreedAmount: {
      type: Number,
      required: [true, "Agreed amount is required"],
      min: [0, "Agreed amount must be greater than or equal to 0"],
    },

    expectedCompletionDate: {
      type: Date,
      required: [true, "Expected completion date is required"],
    },

    status: {
      type: String,
      enum: {
        values: ["pending", "in_progress", "ready", "completed", "cancelled"],
        message: "Invalid order status",
      },
      default: "pending",
    },

    notes: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
