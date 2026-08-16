import mongoose from "mongoose";

const customerPaymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order reference is required"],
      index: true,
    },

    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0.01, "Amount must be greater than zero"],
    },

    paymentDate: {
      type: Date,
      required: [true, "Payment date is required"],
    },

    customerName: {
      type: String,
      required: [true, "Customer name snapshot is required"],
    },

    orderNumber: {
      type: String,
      required: [true, "Order number snapshot is required"],
    },

    note: {
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

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const CustomerPayment = mongoose.model("CustomerPayment", customerPaymentSchema);

export default CustomerPayment;
