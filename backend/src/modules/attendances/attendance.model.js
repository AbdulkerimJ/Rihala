import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
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

    morningStatus: {
      type: String,
      required: [true, "Morning status is required"],
      enum: {
        values: ["PRESENT", "ABSENT", "PERMISSION"],
        message: "Morning status must be PRESENT, ABSENT, or PERMISSION",
      },
      trim: true,
    },

    afternoonStatus: {
      type: String,
      required: [true, "Afternoon status is required"],
      enum: {
        values: ["PRESENT", "ABSENT", "PERMISSION"],
        message: "Afternoon status must be PRESENT, ABSENT, or PERMISSION",
      },
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

attendanceSchema.index({ employee: 1, workDate: 1 }, { unique: true });
attendanceSchema.index({
  employee: 1,
  workDate: 1,
  morningStatus: 1,
  afternoonStatus: 1,
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
