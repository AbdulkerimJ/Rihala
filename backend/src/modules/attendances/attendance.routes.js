import express from "express";

import authenticate from "../../core/middleware/authenticate.js";
import authorize from "../../core/middleware/authorize.js";
import validate from "../../core/middleware/validate.js";
import {
  getAllAttendancesController,
  createAttendanceController,
  getAttendanceByIdController,
  updateAttendanceController,
} from "./attendance.controller.js";
import {
  createAttendanceSchema,
  updateAttendanceSchema,
  attendanceIdSchema,
  attendanceQuerySchema,
} from "./attendance.validation.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("attendances.read"),
  validate(
    attendanceQuerySchema,
    "Please check the attendance filters.",
    "query",
  ),
  getAllAttendancesController,
);

router.post(
  "/",
  authorize("attendances.create"),
  validate(createAttendanceSchema, "Please check the attendance information."),
  createAttendanceController,
);

router.get(
  "/:id",
  authorize("attendances.read"),
  validate(attendanceIdSchema, "Please check the attendance id.", "params"),
  getAttendanceByIdController,
);

router.patch(
  "/:id",
  authorize("attendances.update"),
  validate(attendanceIdSchema, "Please check the attendance id.", "params"),
  validate(updateAttendanceSchema, "Please check the attendance information."),
  updateAttendanceController,
);

export default router;
