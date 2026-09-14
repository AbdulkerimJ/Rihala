import mongoose from "mongoose";

const allocationSchema = new mongoose.Schema({
  purchase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Purchase",
    required: [true, "Purchase is required for allocation"],
  },
  amount: {
    type: Number,
    required: [true, "Allocation amount is required"],
    min: [0.01, "Allocation amount must be greater than 0"],
  },
});

const supplierPaymentSchema = new mongoose.Schema(
  {
    paymentReference: {
      type: String,
      required: [true, "Payment reference is required"],
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["SPECIFIC", "GENERAL"],
      required: [true, "Payment type is required"],
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: [true, "Supplier is required"],
      index: true,
    },
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0.01, "Payment amount must be greater than 0"],
    },
    unallocatedAmount: {
      type: Number,
      required: true,
      min: [0, "Unallocated amount cannot be negative"],
    },
    paymentDate: {
      type: Date,
      required: [true, "Payment date is required"],
    },
    note: {
      type: String,
      trim: true,
      default: null,
    },
    allocations: {
      type: [allocationSchema],
      default: [],
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
  },
  {
    timestamps: true,
  }
);

const SupplierPayment = mongoose.model("SupplierPayment", supplierPaymentSchema);

export default SupplierPayment;
