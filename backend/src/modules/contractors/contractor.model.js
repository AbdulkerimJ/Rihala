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
  },
  {
    timestamps: true,
  }
);

contractorSchema.index(
  { phone: 1 },
  { unique: true, sparse: true, partialFilterExpression: { phone: { $type: "string" } } }
);

const Contractor = mongoose.model("Contractor", contractorSchema);

export default Contractor;
