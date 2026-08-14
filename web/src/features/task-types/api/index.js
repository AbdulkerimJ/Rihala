import { createCrudApi } from "../../../api/crud";

const taskTypesApi = createCrudApi("/task-types");

export const getTaskTypes = taskTypesApi.getAll;
export const getTaskTypeById = taskTypesApi.getById;
export const createTaskType = taskTypesApi.create;
export const updateTaskType = taskTypesApi.update;
export const deleteTaskType = taskTypesApi.delete;

