import mongoose from "mongoose";

const contractSchema = new mongoose.Schema(
  {
    contractNumber: {
      type: String,
      required: true,
      unique: true,
    },
    contractor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contractor",
      required: [true, "Contractor is required"],
      index: true,
      immutable: true,
    },
    contractorName: {
      type: String,
      required: [true, "Contractor name snapshot is required"],
      trim: true,
      immutable: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "Task is required"],
      index: true,
      immutable: true,
    },
    taskName: {
      type: String,
      required: [true, "Task name snapshot is required"],
      trim: true,
      immutable: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      immutable: true,
    },
    unitPrice: {
      type: Number,
      required: [true, "Unit price is required"],
      min: [0.01, "Unit price must be greater than zero"],
      immutable: true,
    },
    contractDate: {
      type: Date,
      required: [true, "Contract date is required"],
      immutable: true,
      index: true,
    },
    expectedCompletionDate: {
      type: Date,
      index: true,
    },
    note: {
      type: String,
      trim: true,
      immutable: true,
    },
    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "COMPLETED", "CANCELLED"],
        message: "Status must be ACTIVE, COMPLETED, or CANCELLED",
      },
      default: "ACTIVE",
      index: true,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
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

contractSchema.index({ contractor: 1, status: 1 });

const Contract = mongoose.model("Contract", contractSchema);

export default Contract;
