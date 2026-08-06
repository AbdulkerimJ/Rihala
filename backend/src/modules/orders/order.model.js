import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, "Item description is required"],
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, "Item quantity is required"],
    min: [0.01, "Quantity must be greater than 0"],
  },
  unit: {
    type: String,
    required: [true, "Item unit is required"],
    trim: true,
  },
  specifications: {
    type: String,
    trim: true,
    default: null,
  },
});

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: [true, "Order number is required"],
      unique: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
    },

    customerName: {
      type: String,
      required: [true, "Customer name snapshot is required"],
    },

    customerPhone: {
      type: String,
      required: [true, "Customer phone snapshot is required"],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Order creator is required"],
    },

    date: {
      type: Date,
      required: [true, "Order date is required"],
    },

    items: {
      type: [orderItemSchema],
      validate: [
        {
          validator: (arr) => arr.length > 0,
          message: "At least one item is required",
        },
      ],
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

    statusHistory: {
      type: [statusHistorySchema],
      default: [],
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
