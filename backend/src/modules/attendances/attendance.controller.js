import { catchAsync } from "../../core/utils/catchAsync.js";
import {
  createAttendanceService,
  getAttendancesService,
  getAttendanceByIdService,
  updateAttendanceService,
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

export {
  getAllAttendancesController,
  createAttendanceController,
  getAttendanceByIdController,
  updateAttendanceController,
};
