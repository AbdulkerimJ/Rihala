import mongoose from "mongoose";

const weeklyPayrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee is required"],
      index: true,
    },

    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      index: true,
    },

    endDate: {
      type: Date,
      required: [true, "End date is required"],
      index: true,
    },

    normalEarnings: {
      type: Number,
      required: [true, "Normal earnings are required"],
      min: [0, "Normal earnings cannot be negative"],
      default: 0,
    },

    overtimeEarnings: {
      type: Number,
      required: [true, "Overtime earnings are required"],
      min: [0, "Overtime earnings cannot be negative"],
      default: 0,
    },

    totalEarnings: {
      type: Number,
      required: [true, "Total earnings are required"],
      min: [0, "Total earnings cannot be negative"],
      default: 0,
    },

    status: {
      type: String,
      required: [true, "Status is required"],
      enum: {
        values: ["CLOSED"],
        message: "Status must be CLOSED",
      },
      default: "CLOSED",
      index: true,
    },

    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

weeklyPayrollSchema.index(
  { employee: 1, startDate: 1, endDate: 1 },
  { unique: true }
);

const WeeklyPayroll = mongoose.model("WeeklyPayroll", weeklyPayrollSchema);

export default WeeklyPayroll;
