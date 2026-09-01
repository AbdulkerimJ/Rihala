import Attendance from "./attendance.model.js";
import { ensureEmployeeExists } from "../employees/employee.service.js";
import WeeklyPayroll from "../weeklyPayrolls/weeklyPayroll.model.js";
import attendanceQueryConfig from "./attendance.query.js";
import ConflictError from "../../core/errors/ConflictError.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import ValidationError from "../../core/errors/ValidationError.js";
import { getPaginatedQueryResult } from "../../core/utils/query.js";
import { normalizeDateValue, isWorkday, isFutureDate } from "../../core/utils/date.js";

const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "PERMISSION"];

const calculateDailyAttendancePortion = (morningStatus, afternoonStatus) => {
  if (morningStatus === "PRESENT" && afternoonStatus === "PRESENT") {
    return 1;
  }

  if (
    (morningStatus === "PRESENT" && afternoonStatus !== "PRESENT") ||
    (morningStatus !== "PRESENT" && afternoonStatus === "PRESENT")
  ) {
    return 0.5;
  }

  return 0;
};

const ensureAttendanceDateIsValid = (employee, workDate) => {
  const normalizedWorkDate = normalizeDateValue(workDate);
  const normalizedStartDate = normalizeDateValue(employee.employmentStartDate);
  const normalizedEndDate = normalizeDateValue(employee.employmentEndDate);
  if (isFutureDate(normalizedWorkDate)) {
    const msg = "Attendance cannot be recorded for future dates.";
    throw new ValidationError(msg, [{ field: "workDate", message: msg }]);
  }

  if (!isWorkday(normalizedWorkDate)) {
    const msg = "Attendance can only be recorded for Monday through Saturday.";
    throw new ValidationError(msg, [{ field: "workDate", message: msg }]);
  }

  if (normalizedWorkDate < normalizedStartDate) {
    const msg = "Work date is before the employee's start date.";
    throw new ValidationError(msg, [{ field: "workDate", message: msg }]);
  }

  if (normalizedEndDate && normalizedWorkDate > normalizedEndDate) {
    const msg = "Work date is after the employee's end date.";
    throw new ValidationError(msg, [{ field: "workDate", message: msg }]);
  }
};

const ensureNotClosedInPayroll = async (employeeId, workDate) => {
  const normalizedWorkDate = normalizeDateValue(workDate);
  const closedPayroll = await WeeklyPayroll.findOne({
    employee: employeeId,
    startDate: { $lte: normalizedWorkDate },
    endDate: { $gte: normalizedWorkDate },

  });

  if (closedPayroll) {
    const msg = "Cannot modify attendance for a closed payroll period.";
    throw new ValidationError(msg, [{ field: "workDate", message: msg }]);
  }
};

const createAttendanceService = async (data) => {
  const normalizedData = {
    ...data,
    workDate: normalizeDateValue(data.workDate),
  };

  const employee = await ensureEmployeeExists(normalizedData.employee);

  if (employee.status !== "active") {
    throw new ValidationError("Cannot create attendance for an inactive employee.");
  }

  ensureAttendanceDateIsValid(employee, normalizedData.workDate);
  await ensureNotClosedInPayroll(normalizedData.employee, normalizedData.workDate);

  const existingAttendance = await Attendance.findOne({
    employee: normalizedData.employee,
    workDate: normalizedData.workDate,
  });

  if (existingAttendance) {
    const msg = "Attendance already exists for this employee and work date.";
    throw new ConflictError(msg, [{ field: "workDate", message: msg }]);
  }

  try {
    return await Attendance.create(normalizedData);
  } catch (error) {
    if (error?.code === 11000) {
      const msg = "Attendance already exists for this employee and work date.";
      throw new ConflictError(msg, [{ field: "workDate", message: msg }]);
    }

    throw error;
  }
};

const getAttendancesService = async (filters = {}) => {
  return getPaginatedQueryResult(Attendance, filters, attendanceQueryConfig, {
    populate: ["employee"],
  });
};

const getAttendanceByIdService = async (attendanceId) => {
  const attendance =
    await Attendance.findById(attendanceId).populate("employee");

  if (!attendance) {
    throw new NotFoundError("Attendance not found.");
  }

  return attendance;
};

const updateAttendanceService = async (attendanceId, updateData) => {
  const attendance = await Attendance.findById(attendanceId);

  if (!attendance) {
    throw new NotFoundError("Attendance not found.");
  }

  await ensureNotClosedInPayroll(attendance.employee, attendance.workDate);

  const normalizedUpdateData = { ...updateData };

  try {
    Object.assign(attendance, normalizedUpdateData);
    await attendance.save();
    return attendance.populate("employee");
  } catch (error) {
    if (error?.code === 11000) {
      const msg = "Attendance already exists for this employee and work date.";
      throw new ConflictError(msg, [{ field: "workDate", message: msg }]);
    }

    throw error;
  }
};

const deleteAttendanceService = async (attendanceId) => {
  const attendance = await Attendance.findById(attendanceId);

  if (!attendance) {
    throw new NotFoundError("Attendance not found.");
  }

  await ensureNotClosedInPayroll(attendance.employee, attendance.workDate);

  await Attendance.findByIdAndDelete(attendanceId);
};

export {
  ATTENDANCE_STATUSES,
  isWorkday,
  calculateDailyAttendancePortion,
  createAttendanceService,
  getAttendancesService,
  getAttendanceByIdService,
  updateAttendanceService,
  deleteAttendanceService,
};
