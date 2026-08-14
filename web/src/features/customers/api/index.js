import { createCrudApi } from "../../../api/crud";

const customersApi = createCrudApi("/customers");

export const getCustomers = customersApi.getAll;
export const getCustomerById = customersApi.getById;
export const createCustomer = customersApi.create;
export const updateCustomer = customersApi.update;
export const deleteCustomer = customersApi.delete;

