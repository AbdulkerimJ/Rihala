import api from "../../../api/axios";

export const login = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

export const logout = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const validateInvitation = async (token) => {
  const response = await api.get(`/auth/invitation/validate/${token}`);
  return response.data;
};

export const acceptInvitation = async ({
  token,
  code,
  password,
  confirmPassword,
}) => {
  const response = await api.post("/auth/invitation/accept", {
    token,
    code,
    password,
    confirmPassword,
  });
  return response.data;
};

export const forgotPassword = async ({ email }) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

export const resetPassword = async ({ token, newPassword }) => {
  const response = await api.post("/auth/reset-password", {
    token,
    newPassword,
  });
  return response.data;
};
