import { createCrudApi } from "../../../api/crud";

const tasksApi = createCrudApi("/tasks");

export const getTasks = tasksApi.getAll;
export const getTaskById = tasksApi.getById;
export const createTask = tasksApi.create;
export const updateTask = tasksApi.update;
export const deleteTask = tasksApi.delete;

