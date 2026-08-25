import Overtime from "./overtime.model.js";
import { ensureEmployeeExists } from "../employees/employee.service.js";
import WeeklyPayroll from "../weeklyPayrolls/weeklyPayroll.model.js";
import overtimeQueryConfig from "./overtime.query.js";
import ConflictError from "../../core/errors/ConflictError.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import ValidationError from "../../core/errors/ValidationError.js";
import { getPaginatedQueryResult } from "../../core/utils/query.js";
import { normalizeDateValue, isFutureDate } from "../../core/utils/date.js";

const ensureEmploymentPeriodIsValid = (employee, workDate) => {
  const normalizedWorkDate = normalizeDateValue(workDate);
  const normalizedStartDate = normalizeDateValue(employee.employmentStartDate);
  const normalizedEndDate = normalizeDateValue(employee.employmentEndDate);
  if (isFutureDate(normalizedWorkDate)) {
    const msg = "Overtime cannot be recorded for future dates.";
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
    status: "CLOSED",
  });

  if (closedPayroll) {
    const msg = "Cannot modify overtime for a closed payroll period.";
    throw new ValidationError(msg, [{ field: "workDate", message: msg }]);
  }
};

const createOvertimeService = async (data) => {
  const normalizedData = {
    ...data,
    workDate: normalizeDateValue(data.workDate),
  };

  const employee = await ensureEmployeeExists(normalizedData.employee);

  if (employee.status !== "active") {
    throw new ValidationError("Cannot create overtime for an inactive employee.");
  }

  ensureEmploymentPeriodIsValid(employee, normalizedData.workDate);
  await ensureNotClosedInPayroll(normalizedData.employee, normalizedData.workDate);

  const existingOvertime = await Overtime.findOne({
    employee: normalizedData.employee,
    workDate: normalizedData.workDate,
  });

  if (existingOvertime) {
    const msg = "Overtime already exists for this employee and work date.";
    throw new ConflictError(msg, [{ field: "workDate", message: msg }]);
  }

  try {
    return await Overtime.create(normalizedData);
  } catch (error) {
    if (error?.code === 11000) {
      const msg = "Overtime already exists for this employee and work date.";
      throw new ConflictError(msg, [{ field: "workDate", message: msg }]);
    }

    throw error;
  }
};

const getOvertimesService = async (filters = {}) => {
  return getPaginatedQueryResult(Overtime, filters, overtimeQueryConfig, {
    populate: ["employee"],
  });
};

const getOvertimeByIdService = async (overtimeId) => {
  const overtime = await Overtime.findById(overtimeId).populate("employee");

  if (!overtime) {
    throw new NotFoundError("Overtime not found.");
  }

  return overtime;
};

const deleteOvertimeService = async (overtimeId) => {
  const overtime = await Overtime.findById(overtimeId);

  if (!overtime) {
    throw new NotFoundError("Overtime not found.");
  }

  await ensureNotClosedInPayroll(overtime.employee, overtime.workDate);

  await Overtime.findByIdAndDelete(overtimeId);
};

const updateOvertimeService = async (overtimeId, updateData) => {
  const overtime = await Overtime.findById(overtimeId);

  if (!overtime) {
    throw new NotFoundError("Overtime not found.");
  }

  await ensureNotClosedInPayroll(overtime.employee, overtime.workDate);

  try {
    Object.assign(overtime, updateData);
    await overtime.save();
    return overtime.populate("employee");
  } catch (error) {
    if (error?.code === 11000) {
      const msg = "Overtime already exists for this employee and work date.";
      throw new ConflictError(msg, [{ field: "workDate", message: msg }]);
    }

    throw error;
  }
};

export {
  createOvertimeService,
  getOvertimesService,
  getOvertimeByIdService,
  updateOvertimeService,
  deleteOvertimeService,
};
