import { catchAsync } from "../../core/utils/catchAsync.js";
import * as taskTypeService from "./taskType.service.js";

const createTaskType = catchAsync(async (req, res) => {
  const taskType = await taskTypeService.createTaskTypeService(req.validatedBody);

  res.status(201).json({
    status: "success",
    data: {
      taskType,
    },
  });
});

const getTaskTypes = catchAsync(async (req, res) => {
  const result = await taskTypeService.getTaskTypesService(req.validatedQuery);

  res.status(200).json({
    status: "success",
    data: result,
  });
});

const getTaskTypeById = catchAsync(async (req, res) => {
  const taskType = await taskTypeService.getTaskTypeByIdService(req.validatedParams.id);

  res.status(200).json({
    status: "success",
    data: {
      taskType,
    },
  });
});

const updateTaskType = catchAsync(async (req, res) => {
  const taskType = await taskTypeService.updateTaskTypeService(
    req.validatedParams.id,
    req.validatedBody
  );

  res.status(200).json({
    status: "success",
    data: {
      taskType,
    },
  });
});

const deleteTaskType = catchAsync(async (req, res) => {
  await taskTypeService.deleteTaskTypeService(req.validatedParams.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export {
  createTaskType,
  getTaskTypes,
  getTaskTypeById,
  updateTaskType,
  deleteTaskType,
};
