import TaskType from "./taskType.model.js";
import taskTypeQueryConfig from "./taskType.query.js";
import ConflictError from "../../core/errors/ConflictError.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import ValidationError from "../../core/errors/ValidationError.js";
import { getPaginatedQueryResult } from "../../core/utils/query.js";
import mongoose from "mongoose";

const createTaskTypeService = async (data) => {
  const existingType = await TaskType.findOne({ name: data.name });
  
  if (existingType) {
    const msg = "A task type with this name already exists.";
    throw new ConflictError(msg, [{ field: "name", message: msg }]);
  }

  const taskType = await TaskType.create(data);
  return taskType;
};

const getTaskTypesService = async (filters = {}) => {
  return getPaginatedQueryResult(TaskType, filters, taskTypeQueryConfig);
};

const getTaskTypeByIdService = async (id) => {
  const taskType = await TaskType.findById(id);

  if (!taskType) {
    throw new NotFoundError("Task type not found.");
  }

  return taskType;
};

const updateTaskTypeService = async (id, updateData) => {
  const taskType = await TaskType.findById(id);

  if (!taskType) {
    throw new NotFoundError("Task type not found.");
  }

  if (updateData.name && updateData.name !== taskType.name) {
    const existingType = await TaskType.findOne({ name: updateData.name });
    if (existingType) {
      const msg = "A task type with this name already exists.";
      throw new ConflictError(msg, [{ field: "name", message: msg }]);
    }
  }

  if (updateData.name !== undefined) taskType.name = updateData.name;
  if (updateData.isActive !== undefined) taskType.isActive = updateData.isActive;

  await taskType.save();
  return taskType;
};

const deleteTaskTypeService = async (id) => {
  const taskType = await TaskType.findById(id);

  if (!taskType) {
    throw new NotFoundError("Task type not found.");
  }

  // Check if TaskType is in use by any Task
  const Task = mongoose.model("Task");
  if (Task) {
    const inUse = await Task.exists({ taskType: id });
    if (inUse) {
      throw new ValidationError("Task type is in use and cannot be deleted. Deactivate it instead.");
    }
  }

  await TaskType.deleteOne({ _id: id });
  return taskType;
};

export {
  createTaskTypeService,
  getTaskTypesService,
  getTaskTypeByIdService,
  updateTaskTypeService,
  deleteTaskTypeService,
};
