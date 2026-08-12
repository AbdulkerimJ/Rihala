import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Task name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    taskType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaskType",
      required: [true, "Task type is required"],
      index: true,
    },
    defaultUnitPrice: {
      type: Number,
      required: [true, "Default unit price is required"],
      min: [0.01, "Default unit price must be greater than zero"],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;
