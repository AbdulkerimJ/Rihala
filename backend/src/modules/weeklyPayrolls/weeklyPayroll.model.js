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



    closedAt: {
      type: Date,
      default: null,
    },

    dailyBreakdown: [
      {
        workDate: {
          type: Date,
          required: true,
        },
        morningStatus: {
          type: String,
          required: true,
          enum: ["PRESENT", "ABSENT", "PERMISSION"],
        },
        afternoonStatus: {
          type: String,
          required: true,
          enum: ["PRESENT", "ABSENT", "PERMISSION"],
        },
        portion: {
          type: Number,
          required: true,
          min: 0,
          max: 1,
        },
        dailyRate: {
          type: Number,
          required: true,
          min: 0,
        },
        earnings: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    overtimeBreakdown: [
      {
        workDate: {
          type: Date,
          required: true,
        },
        duration: {
          type: String,
          required: true,
          enum: ["HALF_DAY", "FULL_DAY"],
        },
        multiplier: {
          type: Number,
          required: true,
        },
        dailyRate: {
          type: Number,
          required: true,
          min: 0,
        },
        earnings: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
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
