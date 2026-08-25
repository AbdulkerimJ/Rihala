import mongoose from "mongoose";

const contractorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Contractor name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ["active", "inactive"],
        message: "Status must be either active or inactive",
      },
      default: "active",
      index: true,
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
  }
);

contractorSchema.index({ phone: 1 }, { unique: true });
contractorSchema.index({ deletedAt: 1 });

const Contractor = mongoose.model("Contractor", contractorSchema);

export default Contractor;
