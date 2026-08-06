import mongoose from "mongoose";

const purchaseItemSchema = new mongoose.Schema({
  material: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Material",
    required: [true, "Material is required"],
  },
  materialName: {
    type: String,
    required: [true, "Material name is required"],
  },
  materialCategory: {
    type: String,
    required: [true, "Material category is required"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [0.01, "Quantity must be greater than 0"],
  },
  unit: {
    type: String,
    required: [true, "Unit is required"],
  },
  unitPrice: {
    type: Number,
    required: [true, "Unit price is required"],
    min: [0, "Unit price must be positive"],
  },
  subtotal: {
    type: Number,
    required: [true, "Subtotal is required"],
    min: [0, "Subtotal must be positive"],
  },
});

const purchaseSchema = new mongoose.Schema(
  {
    purchaseNumber: {
      type: String,
      required: [true, "Purchase number is required"],
      unique: true,
      trim: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: [true, "Supplier is required"],
      index: true,
    },
    date: {
      type: Date,
      required: [true, "Purchase date is required"],
    },
    items: {
      type: [purchaseItemSchema],
      validate: [
        (val) => val.length > 0,
        "A purchase must contain at least one item",
      ],
    },
    note: {
      type: String,
      trim: true,
      default: null,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"],
    },
    allocatedAmount: {
      type: Number,
      default: 0,
      min: [0, "Allocated amount cannot be negative"],
    },
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PARTIALLY_PAID", "PAID"],
      default: "UNPAID",
    },
  },
  {
    timestamps: true,
  }
);

purchaseSchema.virtual("remainingAmount").get(function () {
  return (this.totalAmount || 0) - (this.allocatedAmount || 0);
});

// Ensure virtuals are included in toJSON
purchaseSchema.set("toJSON", { virtuals: true });
purchaseSchema.set("toObject", { virtuals: true });

const Purchase = mongoose.model("Purchase", purchaseSchema);

export default Purchase;
