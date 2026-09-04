import mongoose from "mongoose";
import Employee from "./employee.model.js";
import WeeklyPayroll from "../weeklyPayrolls/weeklyPayroll.model.js";
import { getCurrentPayrollCalculationService } from "../weeklyPayrolls/weeklyPayroll.service.js";
import EmployeePayment from "../employeePayments/employeePayment.model.js";
import EmployeeRate from "../employeeRates/employeeRate.model.js";
import employeeQueryConfig from "./employee.query.js";
import ConflictError from "../../core/errors/ConflictError.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import ValidationError from "../../core/errors/ValidationError.js";
import { getPaginatedQueryResult } from "../../core/utils/query.js";
import { normalizePhone } from "../../core/utils/phone.js";
import { normalizeDateValue } from "../../core/utils/date.js";

const ensureEmployeeExists = async (employeeId) => {
  const employee = await Employee.findOne({ _id: employeeId, deletedAt: null });

  if (!employee) {
    throw new NotFoundError("Employee not found.");
  }

  return employee;
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
  const initialDailyRate = data.initialDailyRate;

  const session = await mongoose.startSession();
  let createdEmployee;

  try {
    await session.withTransaction(async () => {
      if (normalizedData.phone) {
        const existingPhoneEmployee = await Employee.findOne({
          phone: normalizedData.phone,
        }).session(session);

        if (existingPhoneEmployee) {
          if (existingPhoneEmployee.deletedAt !== null) {
            // Restore deleted employee
            existingPhoneEmployee.name = normalizedData.name;
            if (normalizedData.employmentStartDate) {
              existingPhoneEmployee.employmentStartDate = normalizedData.employmentStartDate;
            }
            if (normalizedData.employmentEndDate !== undefined) {
              existingPhoneEmployee.employmentEndDate = normalizedData.employmentEndDate;
            }
            existingPhoneEmployee.status = normalizedData.status || "active";
            existingPhoneEmployee.deletedAt = null;
            existingPhoneEmployee.deletedBy = null;
            
            await existingPhoneEmployee.save({ session });
            createdEmployee = existingPhoneEmployee;
          } else {
            const msg = "An employee with this phone already exists.";
            throw new ConflictError(msg, [{ field: "phone", message: msg }]);
          }
        }
      }

      if (!createdEmployee) {
        ensureEmploymentDatesAreValid(
          normalizedData.employmentStartDate,
          normalizedData.employmentEndDate,
        );

        const newEmployees = await Employee.create([normalizedData], { session });
        createdEmployee = newEmployees[0];
      }

      if (initialDailyRate) {
        await EmployeeRate.create([{
          employee: createdEmployee._id,
          dailyRate: initialDailyRate,
          effectiveDate: createdEmployee.employmentStartDate,
        }], { session });
      }
    });
  } finally {
    session.endSession();
  }

  return createdEmployee;
};

const getEmployeesService = async (filters = {}) => {
  return getPaginatedQueryResult(Employee, filters, employeeQueryConfig, {
    query: { deletedAt: null }
  });
};

const getEmployeeByIdService = async (employeeId) => {
  return ensureEmployeeExists(employeeId);
};

const updateEmployeeService = async (employeeId, updateData) => {
  const employee = await Employee.findOne({ _id: employeeId, deletedAt: null });

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
      const msg = "An employee with this phone already exists.";
      throw new ConflictError(msg, [{ field: "phone", message: msg }]);
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

const getEmployeeStatsService = async (employeeId) => {
  await ensureEmployeeExists(employeeId);

  const objectId = new mongoose.Types.ObjectId(employeeId);

  const [payrollResult, paymentResult, pendingCalculation] = await Promise.all([
    WeeklyPayroll.aggregate([
      { $match: { employee: objectId } },
      { $group: { _id: null, totalEarned: { $sum: "$totalEarnings" } } },
    ]),
    EmployeePayment.aggregate([
      { $match: { employee: objectId, status: "active" } },
      { $group: { _id: null, totalPaid: { $sum: "$amount" } } },
    ]),
    getCurrentPayrollCalculationService(employeeId)
  ]);

  const pendingEarnings = pendingCalculation?.totalEarnings || 0;
  const totalEarned = (payrollResult[0]?.totalEarned ?? 0) + pendingEarnings;
  const totalPaid = paymentResult[0]?.totalPaid ?? 0;
  const currentBalance = totalEarned - totalPaid;

  return { totalEarned, totalPaid, currentBalance };
};

const softDeleteEmployeeService = async (employeeId, deletedByUserId) => {
  const employee = await Employee.findOne({ _id: employeeId, deletedAt: null });

  if (!employee) {
    throw new NotFoundError("Employee not found.");
  }

  const { currentBalance } = await getEmployeeStatsService(employeeId);
  if (currentBalance !== 0) {
    throw new ValidationError("Employee has an outstanding balance. Settle it before deleting.");
  }

  employee.status = "inactive";
  employee.deletedAt = new Date();
  employee.deletedBy = deletedByUserId ?? null;

  await employee.save();
  return employee;
};

export {
  ensureEmployeeExists,
  createEmployeeService,
  getEmployeesService,
  getEmployeeByIdService,
  updateEmployeeService,
  getEmployeeStatsService,
  softDeleteEmployeeService,
};
