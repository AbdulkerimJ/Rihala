import { verifyAccessToken } from "../utils/jwt.js";
import UnauthorizedError from "../errors/UnauthorizedError.js";
import User from "../../modules/users/user.model.js";

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Authentication token is missing.");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new UnauthorizedError("Authentication token is missing.");
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        throw new UnauthorizedError("Token has expired.");
      }
      throw new UnauthorizedError("Invalid token.");
    }

    const user = await User.findOne({
      _id: decoded.id,
      deletedAt: null,
    });

    if (!user || user.status === "inactive" || user.status === "invited") {
      throw new UnauthorizedError("User is not authorized or inactive.");
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
