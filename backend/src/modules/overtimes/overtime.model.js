import mongoose from "mongoose";

const overtimeSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee is required"],
      index: true,
    },

    workDate: {
      type: Date,
      required: [true, "Work date is required"],
      index: true,
    },

    duration: {
      type: String,
      required: [true, "Duration is required"],
      enum: {
        values: ["HALF_DAY", "FULL_DAY"],
        message: "Duration must be HALF_DAY or FULL_DAY",
      },
      trim: true,
    },

    dailyRate: {
      type: Number,
      required: [true, "Daily rate is required"],
      min: [0, "Daily rate cannot be negative"],
    },

    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
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

overtimeSchema.index({ employee: 1, workDate: 1 }, { unique: true });

overtimeSchema.index({ employee: 1, workDate: 1, duration: 1 });

const Overtime = mongoose.model("Overtime", overtimeSchema);

export default Overtime;
