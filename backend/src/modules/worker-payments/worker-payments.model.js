import mongoose from "mongoose";

const workerPaymentSchema = new mongoose.Schema(
  {
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
    },
    amount: {
      type: Number,
      min: 0,
    },
    paymentDate: {
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

export const WorkerPayment = mongoose.model(
  "WorkerPayment",
  workerPaymentSchema,
);
