import api from '../../../api/axios';

export const getPermissions = async () => {
  const response = await api.get('/permissions');
  return response.data;
};
