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

  const existingRate = await EmployeeRate.findOne({
    employee: normalizedData.employee,
    effectiveDate: normalizedData.effectiveDate,
  });

  if (existingRate) {
    throw new ConflictError(
      "An employee rate already exists for this employee and effective date.",
    );
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
