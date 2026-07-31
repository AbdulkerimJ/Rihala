import { catchAsync } from "../../core/utils/catchAsync.js";
import {
  loginService,
  refreshAccessTokenService,
  logoutService,
  forgotPasswordService,
  resetPasswordService,
  validateInvitationService,
  acceptInvitationService,
} from "./auth.service.js";
import { parseDurationToMs } from "../../core/utils/jwt.js";

// Helper to determine client type from X-Client-Type header
const getClientType = (req) => {
  const headerValue = req.headers["x-client-type"];
  if (
    typeof headerValue === "string" &&
    headerValue.toLowerCase() === "mobile"
  ) {
    return "mobile";
  }
  return "web";
};

// Login controller
const loginController = catchAsync(async (req, res) => {
  const clientType = getClientType(req);
  const { email, password } = req.validatedBody;
  const userAgent = req.headers["user-agent"];
  const ipAddress = req.ip;

  const result = await loginService({
    email,
    password,
    ipAddress,
    userAgent,
  });

  if (clientType === "web") {
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/v1/auth",
      maxAge: parseDurationToMs(process.env.REFRESH_TOKEN_EXPIRES_IN),
    });

    return res.status(200).json({
      status: "success",
      data: {
        accessToken: result.accessToken,
      },
    });
  }

  // Mobile client receives both tokens in response body
  res.status(200).json({
    status: "success",
    data: {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

// Refresh access token controller
const refreshController = catchAsync(async (req, res) => {
  const refreshToken =
    req.cookies?.refreshToken ||
    req.validatedBody?.refreshToken ||
    req.body?.refreshToken;

  const result = await refreshAccessTokenService(refreshToken);

  res.status(200).json({
    status: "success",
    data: {
      accessToken: result.accessToken,
    },
  });
});

// Logout controller
const logoutController = catchAsync(async (req, res) => {
  const refreshToken =
    req.cookies?.refreshToken ||
    req.validatedBody?.refreshToken ||
    req.body?.refreshToken;

  await logoutService(refreshToken);

  // Always clear cookie for web requests or if cookie exists
  res.clearCookie("refreshToken", {
    path: "/api/v1/auth",
  });

  res.status(200).json({
    status: "success",
    message: "Logged out successfully.",
  });
});

// Forgot password controller
const forgotPasswordController = catchAsync(async (req, res) => {
  const result = await forgotPasswordService(req.validatedBody.email);

  res.status(200).json({
    status: "success",
    message: result.message,
  });
});

// Reset password controller
const resetPasswordController = catchAsync(async (req, res) => {
  const { token, newPassword } = req.validatedBody;
  const result = await resetPasswordService(token, newPassword);

  res.status(200).json({
    status: "success",
    message: result.message,
  });
});

// Validate invitation token controller
const validateInvitationController = catchAsync(async (req, res) => {
  const { token } = req.params;
  const result = await validateInvitationService(token);

  res.status(200).json({
    status: "success",
    data: result,
  });
});

// Accept invitation and set password controller
const acceptInvitationController = catchAsync(async (req, res) => {
  const { token, password } = req.validatedBody;
  const result = await acceptInvitationService(token, password);

  res.status(200).json({
    status: "success",
    message: result.message,
  });
});

export {
  loginController,
  refreshController,
  logoutController,
  forgotPasswordController,
  resetPasswordController,
  validateInvitationController,
  acceptInvitationController,
};
