import mongoose from "mongoose";

const verificationTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },

    type: {
      type: String,
      enum: ["password_reset", "invitation"],
      required: [true, "Token type is required"],
    },

    tokenHash: {
      type: String,
      required: [true, "Token hash is required"],
      index: true,
    },

    codeHash: {
      type: String,
      default: null,
    },

    codeExpiresAt: {
      type: Date,
      default: null,
    },

    codeAttempts: {
      type: Number,
      default: 0,
    },

    expiresAt: {
      type: Date,
      required: [true, "Expiration date is required"],
    },

    usedAt: {
      type: Date,
      default: null,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const VerificationToken = mongoose.model(
  "VerificationToken",
  verificationTokenSchema,
);

export default VerificationToken;
