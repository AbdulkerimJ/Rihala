import catchAsync from "../../core/utils/catchAsync.js";
import * as taskService from "./task.service.js";

const createTask = catchAsync(async (req, res) => {
  const task = await taskService.createTaskService(req.validatedBody);

  res.status(201).json({
    status: "success",
    data: {
      task,
    },
  });
});

const getTasks = catchAsync(async (req, res) => {
  const result = await taskService.getTasksService(req.validatedQuery);

  res.status(200).json({
    status: "success",
    data: result,
  });
});

const getTaskById = catchAsync(async (req, res) => {
  const task = await taskService.getTaskByIdService(req.validatedParams.id);

  res.status(200).json({
    status: "success",
    data: {
      task,
    },
  });
});

const updateTask = catchAsync(async (req, res) => {
  const task = await taskService.updateTaskService(
    req.validatedParams.id,
    req.validatedBody
  );

  res.status(200).json({
    status: "success",
    data: {
      task,
    },
  });
});

const deleteTask = catchAsync(async (req, res) => {
  await taskService.deleteTaskService(req.validatedParams.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
