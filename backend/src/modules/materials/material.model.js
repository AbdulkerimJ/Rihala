import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Material name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      unique: true,
    },
    category: {
      type: String,
      required: [true, "Material category is required"],
      enum: {
        values: [
          "MDF",
          "Wood",
          "Fabric",
          "Foam",
          "Safarian",
          "Nails",
          "Paint",
          "Adhesives",
          "Hardware",
          "Chemicals",
          "Other",
        ],
        message: "Invalid material category",
      },
    },
    unit: {
      type: String,
      required: [true, "Material unit is required"],
      enum: {
        values: ["piece", "kg", "meter", "liter", "roll"],
        message: "Invalid material unit",
      },
    },
    status: {
      type: String,
      enum: {
        values: ["active", "inactive"],
        message: "Status must be active or inactive",
      },
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

const Material = mongoose.model("Material", materialSchema);

export default Material;
