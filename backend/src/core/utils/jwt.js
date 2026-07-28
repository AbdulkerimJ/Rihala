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
 * Generate Refresh Token with payload { id, email }
 */
export const generateRefreshToken = (payload) => {
  const cleanPayload = {
    id: payload.id || payload._id,
    email: payload.email,
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
