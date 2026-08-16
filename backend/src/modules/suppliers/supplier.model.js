import mongoose from "mongoose";
import { normalizePhone } from "../../core/utils/phone.js";

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Supplier name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      unique: true,
      set: (value) => normalizePhone(value),
    },
    address: {
      type: String,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: {
        values: ["active", "inactive"],
        message: "Status must be active or inactive",
      },
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

const Supplier = mongoose.model("Supplier", supplierSchema);

export default Supplier;
