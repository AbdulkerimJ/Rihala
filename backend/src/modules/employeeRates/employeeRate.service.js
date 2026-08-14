import WeeklyPayroll from "../weeklyPayrolls/weeklyPayroll.model.js";
import EmployeeRate from "./employeeRate.model.js";
import { ensureEmployeeExists } from "../employees/employee.service.js";
import employeeRateQueryConfig from "./employeeRate.query.js";
import ConflictError from "../../core/errors/ConflictError.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import ValidationError from "../../core/errors/ValidationError.js";
import { getPaginatedQueryResult } from "../../core/utils/query.js";
import { normalizeDateValue } from "../../core/utils/date.js";

const createEmployeeRateService = async (data) => {
  const normalizedData = {
    ...data,
    effectiveDate: normalizeDateValue(data.effectiveDate),
  };

  const employee = await ensureEmployeeExists(normalizedData.employee);

  if (employee.status !== "active") {
    throw new ValidationError("Cannot create rate for an inactive employee");
  }

  // Warn if the effective date falls inside an already-closed payroll period.
  // The historical payroll is immutable, but a backdated rate would create
  // confusing rate history that contradicts the closed payroll totals.
  const closedPayrollForPeriod = await WeeklyPayroll.findOne({
    employee: normalizedData.employee,
    startDate: { $lte: normalizedData.effectiveDate },
    endDate: { $gte: normalizedData.effectiveDate },
    status: "CLOSED",
  });

  if (closedPayrollForPeriod) {
    throw new ValidationError(
      "Cannot create a rate with an effective date that falls inside an already-closed payroll period. " +
      "The payroll for that period has been finalized and its earnings cannot be retroactively explained by a new rate.",
    );
  }

  const existingRate = await EmployeeRate.findOne({
    employee: normalizedData.employee,
    effectiveDate: normalizedData.effectiveDate,
  });

  if (existingRate) {
    const msg = "An employee rate already exists for this employee and effective date.";
    throw new ConflictError(msg, [{ field: "effectiveDate", message: msg }]);
  }

  return EmployeeRate.create(normalizedData);
};

const getEmployeeRatesService = async (filters = {}) => {
  return getPaginatedQueryResult(
    EmployeeRate,
    filters,
    employeeRateQueryConfig,
    {
      populate: ["employee"],
    },
  );
};

const getEmployeeRateByIdService = async (employeeRateId) => {
  const employeeRate =
    await EmployeeRate.findById(employeeRateId).populate("employee");

  if (!employeeRate) {
    throw new NotFoundError("Employee rate not found.");
  }

  return employeeRate;
};

const getApplicableRateService = async (employeeId, workDate) => {
  const normalizedWorkDate = normalizeDateValue(workDate);
  const applicableRate = await EmployeeRate.findOne({
    employee: employeeId,
    effectiveDate: { $lte: normalizedWorkDate },
  })
    .sort({ effectiveDate: -1 })
    .populate("employee");

  if (!applicableRate) {
    throw new NotFoundError("No applicable employee rate found for this date.");
  }

  return applicableRate;
};

export {
  createEmployeeRateService,
  getEmployeeRatesService,
  getEmployeeRateByIdService,
  getApplicableRateService,
};
