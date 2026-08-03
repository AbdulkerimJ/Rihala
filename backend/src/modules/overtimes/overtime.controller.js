import { catchAsync } from "../../core/utils/catchAsync.js";
import {
  createOvertimeService,
  getOvertimesService,
  getOvertimeByIdService,
  updateOvertimeService,
} from "./overtime.service.js";

const getAllOvertimesController = catchAsync(async (req, res) => {
  const result = await getOvertimesService(req.validatedQuery || {});

  res.status(200).json({
    status: "success",
    data: result.data,
    pagination: result.pagination,
  });
});

const createOvertimeController = catchAsync(async (req, res) => {
  const overtime = await createOvertimeService(req.validatedBody);

  res.status(201).json({
    status: "success",
    data: overtime,
  });
});

const getOvertimeByIdController = catchAsync(async (req, res) => {
  const overtime = await getOvertimeByIdService(req.validatedParams.id);

  res.status(200).json({
    status: "success",
    data: overtime,
  });
});

const updateOvertimeController = catchAsync(async (req, res) => {
  const overtime = await updateOvertimeService(
    req.validatedParams.id,
    req.validatedBody,
  );

  res.status(200).json({
    status: "success",
    data: overtime,
  });
});

export {
  getAllOvertimesController,
  createOvertimeController,
  getOvertimeByIdController,
  updateOvertimeController,
};
