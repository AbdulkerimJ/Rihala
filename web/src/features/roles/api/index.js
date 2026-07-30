import api from '../../../api/axios';

export const getRoles = async (params) => {
  const response = await api.get('/roles', { params });
  return response.data;
};

export const createRole = async (data) => {
  const response = await api.post('/roles', data);
  return response.data;
};

export const updateRole = async ({ id, data }) => {
  const response = await api.patch(`/roles/${id}`, data);
  return response.data;
};

export const deleteRole = async (id) => {
  const response = await api.delete(`/roles/${id}`);
  return response.data;
};

export const addPermissionsToRole = async ({ id, permissionIds }) => {
  const response = await api.post(`/roles/${id}/permissions`, { permissionIds });
  return response.data;
};

export const removePermissionFromRole = async ({ id, permissionId }) => {
  const response = await api.delete(`/roles/${id}/permissions/${permissionId}`);
  return response.data;
};
