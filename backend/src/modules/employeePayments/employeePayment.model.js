import mongoose from "mongoose";

const employeePaymentSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee is required"],
      index: true,
    },

    employeeName: {
      type: String,
      required: [true, "Employee name snapshot is required"],
      trim: true,
    },

    paymentReference: {
      type: String,
      required: [true, "Payment reference is required"],
      unique: true,
      trim: true,
      index: true,
    },

    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0.01, "Payment amount must be greater than 0"],
    },

    paymentDate: {
      type: Date,
      required: [true, "Payment date is required"],
    },

    type: {
      type: String,
      required: [true, "Payment type is required"],
      enum: {
        values: ["regular", "overtime", "bonus", "advance", "other"],
        message: "Payment type must be regular, overtime, bonus, advance, or other",
      },
    },

    status: {
      type: String,
      enum: {
        values: ["active", "voided"],
        message: "Status must be active or voided",
      },
      default: "active",
      index: true,
    },

    voidReason: {
      type: String,
      trim: true,
      default: null,
    },

    voidedAt: {
      type: Date,
      default: null,
    },

    voidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    note: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

employeePaymentSchema.index({ employee: 1, paymentDate: 1 });

const EmployeePayment = mongoose.model("EmployeePayment", employeePaymentSchema);

export default EmployeePayment;
