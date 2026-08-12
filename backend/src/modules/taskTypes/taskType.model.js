import mongoose from "mongoose";

const taskTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Task type name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);


taskTypeSchema.index({ isActive: 1 });

const TaskType = mongoose.model("TaskType", taskTypeSchema);

export default TaskType;
