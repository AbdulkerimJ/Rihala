import jwt from "jsonwebtoken";

const getAccessTokenSecret = () =>
  process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || "default_access_secret";

const getRefreshTokenSecret = () =>
  process.env.REFRESH_TOKEN_SECRET || "default_refresh_secret";

const getAccessTokenExpiresIn = () =>
  process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";

const getRefreshTokenExpiresIn = () =>
  process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

/**
 * Parse a duration string (e.g. "7d", "24h", "15m", "60s") or raw ms into milliseconds.
 */
export const parseDurationToMs = (duration = getRefreshTokenExpiresIn()) => {
  if (typeof duration === "number") return duration;
  if (/^\d+$/.test(duration)) return parseInt(duration, 10);

  const match = /^(\d+)\s*([smhdw])?$/i.exec(String(duration).trim());
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const value = parseInt(match[1], 10);
  const unit = (match[2] || "ms").toLowerCase();

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    case "w":
      return value * 7 * 24 * 60 * 60 * 1000;
    default:
      return value;
  }
};

/**
 * Get Date object for refresh token expiration using REFRESH_TOKEN_EXPIRES_IN.
 */
export const getRefreshTokenExpiresAt = () => {
  return new Date(Date.now() + parseDurationToMs());
};

/**
 * Generate Access Token with payload { id, email }
 */
export const generateAccessToken = (payload) => {
  const cleanPayload = {
    id: payload.id || payload._id,
    email: payload.email,
  };

  return jwt.sign(cleanPayload, getAccessTokenSecret(), {
    expiresIn: getAccessTokenExpiresIn(),
  });
};

/**
 * Generate Refresh Token with payload { id }
 */
export const generateRefreshToken = (payload) => {
  const cleanPayload = {
    id: payload.id || payload._id,
  };

  return jwt.sign(cleanPayload, getRefreshTokenSecret(), {
    expiresIn: getRefreshTokenExpiresIn(),
  });
};

/**
 * Verify Access Token
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, getAccessTokenSecret());
};

/**
 * Verify Refresh Token
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, getRefreshTokenSecret());
};
