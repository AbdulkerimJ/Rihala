import mongoose from "mongoose";

const workerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      default: "active",
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

export const Worker = mongoose.model("Worker", workerSchema);
