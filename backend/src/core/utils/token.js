import crypto from "crypto";

/**
 * Generate a cryptographically strong random token string.
 */
export const generateRandomToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Generate a cryptographically strong 4-digit invitation code.
 */
export const generateInvitationCode = () => {
  return crypto.randomInt(0, 10000).toString().padStart(4, "0");
};

/**
 * Hash a token string using SHA-256.
 */
export const hashToken = (token) => {
  if (!token) return null;
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Compare a supplied token to a stored hash using constant-time comparison.
 */
export const compareHashedToken = (token, hashedToken) => {
  if (!token || !hashedToken) return false;

  const expectedBuffer = Buffer.from(String(hashedToken), "hex");
  const actualBuffer = Buffer.from(hashToken(String(token)), "hex");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
};
