import Task from "./task.model.js";
import TaskType from "../taskTypes/taskType.model.js";
import taskQueryConfig from "./task.query.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import ValidationError from "../../core/errors/ValidationError.js";
import { getPaginatedQueryResult } from "../../core/utils/query.js";
import mongoose from "mongoose";

const createTaskService = async (data) => {
  const taskType = await TaskType.findById(data.taskType);
  
  if (!taskType) {
    throw new NotFoundError("Task type not found.");
  }
  
  if (!taskType.isActive) {
    throw new ValidationError("Inactive task type cannot be used to create a new task.");
  }

  const task = await Task.create(data);
  return task;
};

const getTasksService = async (filters = {}) => {
  return getPaginatedQueryResult(Task, filters, taskQueryConfig);
};

const getTaskByIdService = async (id) => {
  const task = await Task.findById(id).populate("taskType");

  if (!task) {
    throw new NotFoundError("Task not found.");
  }

  return task;
};

const updateTaskService = async (id, updateData) => {
  const task = await Task.findById(id);

  if (!task) {
    throw new NotFoundError("Task not found.");
  }

  if (updateData.taskType && updateData.taskType !== task.taskType.toString()) {
    const taskType = await TaskType.findById(updateData.taskType);
    if (!taskType) {
      throw new NotFoundError("Task type not found.");
    }
    if (!taskType.isActive) {
      throw new ValidationError("Inactive task type cannot be used for a task.");
    }
    task.taskType = updateData.taskType;
  }

  if (updateData.name !== undefined) task.name = updateData.name;
  if (updateData.defaultUnitPrice !== undefined) task.defaultUnitPrice = updateData.defaultUnitPrice;
  if (updateData.isActive !== undefined) task.isActive = updateData.isActive;

  await task.save();
  return task.populate("taskType");
};

const deleteTaskService = async (id) => {
  const task = await Task.findById(id);

  if (!task) {
    throw new NotFoundError("Task not found.");
  }

  // Check if Task is in use by any Contract
  const Contract = mongoose.model("Contract");
  if (Contract) {
    const inUse = await Contract.exists({ task: id });
    if (inUse) {
      throw new ValidationError("Task is in use and cannot be deleted. Deactivate it instead.");
    }
  }

  await Task.deleteOne({ _id: id });
  return task;
};

export {
  createTaskService,
  getTasksService,
  getTaskByIdService,
  updateTaskService,
  deleteTaskService,
};
