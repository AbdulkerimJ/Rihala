import mongoose from "mongoose";
import { normalizePhone } from "../../core/utils/phone.js";

const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Employee name is required"],
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

    employmentStartDate: {
      type: Date,
      required: [true, "Employment start date is required"],
    },

    employmentEndDate: {
      type: Date,
      default: null,
    },

    dailyRate: {
      type: Number,
      required: [true, "Daily rate is required"],
      min: [0, "Daily rate must be non-negative"],
    },

    status: {
      type: String,
      enum: {
        values: ["active", "inactive"],
        message: "Status must be active or inactive",
      },
      default: "active",
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

employeeSchema.index({ status: 1 });
employeeSchema.index({ employmentStartDate: 1, employmentEndDate: 1 });
employeeSchema.index({ deletedAt: 1 });

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
