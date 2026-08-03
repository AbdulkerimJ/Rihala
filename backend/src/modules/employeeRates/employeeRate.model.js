import mongoose from "mongoose";

const employeeRateSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee is required"],
      index: true,
    },

    dailyRate: {
      type: Number,
      required: [true, "Daily rate is required"],
      min: [0.01, "Daily rate must be greater than 0"],
    },

    effectiveDate: {
      type: Date,
      required: [true, "Effective date is required"],
      index: true,
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

employeeRateSchema.index({ employee: 1, effectiveDate: 1 }, { unique: true });
employeeRateSchema.index({ employee: 1, effectiveDate: 1, dailyRate: 1 });

const EmployeeRate = mongoose.model("EmployeeRate", employeeRateSchema);

export default EmployeeRate;
