import mongoose from "mongoose";

const contractorPaymentSchema = new mongoose.Schema(
  {
    paymentReference: {
      type: String,
      required: true,
      unique: true,
    },
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      required: [true, "Contract reference is required"],
      index: true,
      immutable: true,
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0.01, "Amount must be greater than zero"],
      immutable: true,
    },
    paymentDate: {
      type: Date,
      required: [true, "Payment date is required"],
      immutable: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      enum: {
        values: ["CASH", "BANK_TRANSFER", "CHEQUE", "OTHER"],
        message: "Payment method must be CASH, BANK_TRANSFER, CHEQUE, or OTHER",
      },
      immutable: true,
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
      index: true,
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

contractorPaymentSchema.index({ contract: 1, status: 1 });

const ContractorPayment = mongoose.model("ContractorPayment", contractorPaymentSchema);

export default ContractorPayment;
