import { catchAsync } from "../../core/utils/catchAsync.js";
import {
  createAttendanceService,
  getAttendancesService,
  getAttendanceByIdService,
  updateAttendanceService,
  deleteAttendanceService,
} from "./attendance.service.js";

const getAllAttendancesController = catchAsync(async (req, res) => {
  const result = await getAttendancesService(req.validatedQuery || {});

  res.status(200).json({
    status: "success",
    data: result.data,
    pagination: result.pagination,
  });
});

const createAttendanceController = catchAsync(async (req, res) => {
  const attendance = await createAttendanceService(req.validatedBody);

  res.status(201).json({
    status: "success",
    data: attendance,
  });
});

const getAttendanceByIdController = catchAsync(async (req, res) => {
  const attendance = await getAttendanceByIdService(req.validatedParams.id);

  res.status(200).json({
    status: "success",
    data: attendance,
  });
});

const updateAttendanceController = catchAsync(async (req, res) => {
  const attendance = await updateAttendanceService(
    req.validatedParams.id,
    req.validatedBody,
  );

  res.status(200).json({
    status: "success",
    data: attendance,
  });
});

const deleteAttendanceController = catchAsync(async (req, res) => {
  await deleteAttendanceService(req.validatedParams.id);
  res.status(204).json({
    status: "success",
    data: null,
  });
});

export {
  getAllAttendancesController,
  createAttendanceController,
  getAttendanceByIdController,
  updateAttendanceController,
  deleteAttendanceController,
};
