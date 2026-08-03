import Employee from "./employee.model.js";
import employeeQueryConfig from "./employee.query.js";
import ConflictError from "../../core/errors/ConflictError.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import ValidationError from "../../core/errors/ValidationError.js";
import { getPaginatedQueryResult } from "../../core/utils/query.js";
import { normalizePhone } from "../../core/utils/phone.js";

const normalizeDateValue = (value) => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate;
};

const normalizeEmployeePayload = (data = {}) => {
  const normalizedData = { ...data };

  if (
    normalizedData.name !== undefined &&
    typeof normalizedData.name === "string"
  ) {
    normalizedData.name = normalizedData.name.trim();
  }

  if (normalizedData.phone !== undefined) {
    normalizedData.phone = normalizePhone(normalizedData.phone);
  }

  if (normalizedData.employmentStartDate !== undefined) {
    normalizedData.employmentStartDate = normalizeDateValue(
      normalizedData.employmentStartDate,
    );
  }

  if (normalizedData.employmentEndDate !== undefined) {
    normalizedData.employmentEndDate = normalizeDateValue(
      normalizedData.employmentEndDate,
    );
  }

  return normalizedData;
};

const ensureEmploymentDatesAreValid = (startDate, endDate) => {
  if (endDate && endDate < startDate) {
    throw new ValidationError(
      "employmentEndDate cannot be before employmentStartDate.",
    );
  }
};

const createEmployeeService = async (data) => {
  const normalizedData = normalizeEmployeePayload(data);

  if (normalizedData.phone) {
    const existingPhoneEmployee = await Employee.findOne({
      phone: normalizedData.phone,
    });

    if (existingPhoneEmployee) {
      throw new ConflictError("A employee with this phone already exists.");
    }
  }

  ensureEmploymentDatesAreValid(
    normalizedData.employmentStartDate,
    normalizedData.employmentEndDate,
  );

  return Employee.create(normalizedData);
};

const getEmployeesService = async (filters = {}) => {
  return getPaginatedQueryResult(Employee, filters, employeeQueryConfig);
};

const getEmployeeByIdService = async (employeeId) => {
  const employee = await Employee.findById(employeeId);

  if (!employee) {
    throw new NotFoundError("Employee not found.");
  }

  return employee;
};

const updateEmployeeService = async (employeeId, updateData) => {
  const employee = await Employee.findById(employeeId);

  if (!employee) {
    throw new NotFoundError("Employee not found.");
  }

  const normalizedUpdateData = normalizeEmployeePayload(updateData);

  if (normalizedUpdateData.phone !== undefined) {
    const existingPhoneEmployee = await Employee.findOne({
      phone: normalizedUpdateData.phone,
      _id: { $ne: employeeId },
    });

    if (existingPhoneEmployee) {
      throw new ConflictError("A employee with this phone already exists.");
    }
  }

  const startDate =
    normalizedUpdateData.employmentStartDate ?? employee.employmentStartDate;
  const endDate =
    normalizedUpdateData.employmentEndDate ?? employee.employmentEndDate;

  ensureEmploymentDatesAreValid(startDate, endDate);

  Object.assign(employee, normalizedUpdateData);
  await employee.save();

  return employee;
};

export {
  createEmployeeService,
  getEmployeesService,
  getEmployeeByIdService,
  updateEmployeeService,
};
