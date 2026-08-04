import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee is required"],
      index: true,
    },

    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0.01, "Payment amount must be greater than 0"],
    },

    paymentDate: {
      type: Date,
      required: [true, "Payment date is required"],
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

paymentSchema.index({ employee: 1, paymentDate: 1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
