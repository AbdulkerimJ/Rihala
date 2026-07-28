import crypto from "crypto";

/**
 * Generate a cryptographically strong random token string.
 */
export const generateRandomToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Hash a token string using SHA-256.
 */
export const hashToken = (token) => {
  if (!token) return null;
  return crypto.createHash("sha256").update(token).digest("hex");
};
