import Overtime from "./overtime.model.js";
import { ensureEmployeeExists } from "../employees/employee.service.js";
import WeeklyPayroll from "../weeklyPayrolls/weeklyPayroll.model.js";
import overtimeQueryConfig from "./overtime.query.js";
import ConflictError from "../../core/errors/ConflictError.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import ValidationError from "../../core/errors/ValidationError.js";
import { getPaginatedQueryResult } from "../../core/utils/query.js";
import { getApplicableRateService } from "../employeeRates/employeeRate.service.js";
import { normalizeDateValue } from "../../core/utils/date.js";

const calculateOvertimeAmount = (dailyRate, duration) => {
  const durationFactor = duration === "HALF_DAY" ? 0.5 : 1;
  return dailyRate * 2 * durationFactor;
};

const ensureEmploymentPeriodIsValid = (employee, workDate) => {
  const normalizedWorkDate = normalizeDateValue(workDate);
  const normalizedStartDate = normalizeDateValue(employee.employmentStartDate);
  const normalizedEndDate = normalizeDateValue(employee.employmentEndDate);

  if (normalizedWorkDate < normalizedStartDate) {
    throw new ValidationError("Work date is before the employee's start date.");
  }

  if (normalizedEndDate && normalizedWorkDate > normalizedEndDate) {
    throw new ValidationError("Work date is after the employee's end date.");
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
    throw new ValidationError("Cannot modify overtime for a closed payroll period.");
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

  const applicableRate = await getApplicableRateService(
    normalizedData.employee,
    normalizedData.workDate,
  );

  const amount = calculateOvertimeAmount(
    applicableRate.dailyRate,
    normalizedData.duration,
  );

  try {
    return await Overtime.create({
      ...normalizedData,
      dailyRate: applicableRate.dailyRate,
      amount,
    });
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

const updateOvertimeService = async (overtimeId, updateData) => {
  const overtime = await Overtime.findById(overtimeId);

  if (!overtime) {
    throw new NotFoundError("Overtime not found.");
  }

  await ensureNotClosedInPayroll(overtime.employee, overtime.workDate);

  const normalizedUpdateData = { ...updateData };

  if (normalizedUpdateData.duration !== undefined) {
    normalizedUpdateData.amount = calculateOvertimeAmount(
      overtime.dailyRate,
      normalizedUpdateData.duration,
    );
  }

  try {
    Object.assign(overtime, normalizedUpdateData);
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
  calculateOvertimeAmount,
  createOvertimeService,
  getOvertimesService,
  getOvertimeByIdService,
  updateOvertimeService,
};
