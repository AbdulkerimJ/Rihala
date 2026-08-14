import api from "./axios";

/**
 * Creates standardized CRUD API functions for a given REST endpoint.
 * @param {string} endpoint - e.g. "/customers"
 */
export const createCrudApi = (endpoint) => ({
  getAll: async (params = {}) => {
    const response = await api.get(endpoint, { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`${endpoint}/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post(endpoint, data);
    return response.data;
  },
  update: async ({ id, data }) => {
    const response = await api.patch(`${endpoint}/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`${endpoint}/${id}`);
    return response.data;
  },
});
