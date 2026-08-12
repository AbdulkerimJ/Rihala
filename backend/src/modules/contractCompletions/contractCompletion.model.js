import mongoose from "mongoose";

const contractCompletionSchema = new mongoose.Schema(
  {
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      required: [true, "Contract reference is required"],
      index: true,
      immutable: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      immutable: true,
    },
    recordedAt: {
      type: Date,
      required: [true, "Recorded date is required"],
      immutable: true,
    },
    note: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "VOIDED"],
        message: "Status must be either ACTIVE or VOIDED",
      },
      default: "ACTIVE",
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

contractCompletionSchema.index({ contract: 1, status: 1 });
contractCompletionSchema.index({ contract: 1, recordedAt: -1 });

const ContractCompletion = mongoose.model("ContractCompletion", contractCompletionSchema);

export default ContractCompletion;
