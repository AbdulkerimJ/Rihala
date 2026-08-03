import Attendance from "./attendance.model.js";
import Employee from "../employees/employee.model.js";
import attendanceQueryConfig from "./attendance.query.js";
import ConflictError from "../../core/errors/ConflictError.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import ValidationError from "../../core/errors/ValidationError.js";
import { getPaginatedQueryResult } from "../../core/utils/query.js";

const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "PERMISSION"];

const normalizeDateValue = (value) => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate;
};

const isWorkday = (date) => {
  const day = date.getDay();
  return day >= 1 && day <= 6;
};

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

const ensureEmployeeExists = async (employeeId) => {
  const employee = await Employee.findById(employeeId);

  if (!employee) {
    throw new NotFoundError("Employee not found.");
  }

  return employee;
};

const ensureAttendanceDateIsValid = (employee, workDate) => {
  const normalizedWorkDate = normalizeDateValue(workDate);
  const normalizedStartDate = normalizeDateValue(employee.employmentStartDate);
  const normalizedEndDate = normalizeDateValue(employee.employmentEndDate);

  if (!isWorkday(normalizedWorkDate)) {
    throw new ValidationError(
      "Attendance can only be recorded for Monday through Saturday.",
    );
  }

  if (normalizedWorkDate < normalizedStartDate) {
    throw new ValidationError("Work date is before the employee's start date.");
  }

  if (normalizedEndDate && normalizedWorkDate > normalizedEndDate) {
    throw new ValidationError("Work date is after the employee's end date.");
  }
};

const createAttendanceService = async (data) => {
  const normalizedData = {
    ...data,
    workDate: normalizeDateValue(data.workDate),
  };

  const employee = await ensureEmployeeExists(normalizedData.employee);
  ensureAttendanceDateIsValid(employee, normalizedData.workDate);

  const existingAttendance = await Attendance.findOne({
    employee: normalizedData.employee,
    workDate: normalizedData.workDate,
  });

  if (existingAttendance) {
    throw new ConflictError(
      "Attendance already exists for this employee and work date.",
    );
  }

  try {
    return await Attendance.create(normalizedData);
  } catch (error) {
    if (error?.code === 11000) {
      throw new ConflictError(
        "Attendance already exists for this employee and work date.",
      );
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

  const normalizedUpdateData = { ...updateData };

  try {
    Object.assign(attendance, normalizedUpdateData);
    await attendance.save();
    return attendance.populate("employee");
  } catch (error) {
    if (error?.code === 11000) {
      throw new ConflictError(
        "Attendance already exists for this employee and work date.",
      );
    }

    throw error;
  }
};

export {
  ATTENDANCE_STATUSES,
  calculateDailyAttendancePortion,
  createAttendanceService,
  getAttendancesService,
  getAttendanceByIdService,
  updateAttendanceService,
};
