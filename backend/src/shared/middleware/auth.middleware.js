import jwt from "jsonwebtoken";

import { jwtConfig } from "../../config/jwt.js";

export function protectRoute(request, response, next) {
  const authorizationHeader = request.headers.authorization;
  const bearerToken = authorizationHeader?.startsWith("Bearer ")
    ? authorizationHeader.slice(7)
    : request.cookies?.token;

  if (!bearerToken) {
    return response.status(401).json({
      status: "unauthorized",
      message: "Authentication required.",
    });
  }

  try {
    request.user = jwt.verify(bearerToken, jwtConfig.secret);
    return next();
  } catch (_error) {
    return response.status(401).json({
      status: "unauthorized",
      message: "Invalid authentication token.",
    });
  }
}
