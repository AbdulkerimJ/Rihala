import api from '../../../api/axios';

export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const validateInvitation = async (token) => {
  const response = await api.get(`/auth/invitation/validate/${token}`);
  return response.data;
};

export const acceptInvitation = async ({ token, password, confirmPassword }) => {
  const response = await api.post('/auth/invitation/accept', { token, password, confirmPassword });
  return response.data;
};
