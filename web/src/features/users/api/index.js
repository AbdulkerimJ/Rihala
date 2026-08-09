import api from "../../../api/axios";

export const getUserById = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const getUsers = async (params) => {
  const response = await api.get("/users", { params });
  return response.data;
};

export const getDeletedUsers = async () => {
  const response = await api.get("/users/deleted");
  return response.data;
};

export const createUser = async (data) => {
  const response = await api.post("/users", data);
  return response.data;
};

export const updateUser = async ({ id, data }) => {
  const response = await api.patch(`/users/${id}`, data);
  return response.data;
};

export const activateUser = async (id) => {
  const response = await api.patch(`/users/${id}/activate`);
  return response.data;
};

export const deactivateUser = async (id) => {
  const response = await api.patch(`/users/${id}/deactivate`);
  return response.data;
};

export const restoreUser = async (id) => {
  const response = await api.patch(`/users/${id}/restore`);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

export const assignRolesToUser = async ({ id, roleIds }) => {
  const response = await api.post(`/users/${id}/roles`, { roleIds });
  return response.data;
};

export const removeRoleFromUser = async ({ id, roleId }) => {
  const response = await api.delete(`/users/${id}/roles/${roleId}`);
  return response.data;
};

export const resendInvitation = async (id) => {
  const response = await api.post(`/users/${id}/resend-invitation`);
  return response.data;
};
