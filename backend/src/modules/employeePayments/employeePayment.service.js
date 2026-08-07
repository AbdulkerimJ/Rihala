import EmployeePayment from "./employeePayment.model.js";
import { ensureEmployeeExists } from "../employees/employee.service.js";
import employeePaymentQueryConfig from "./employeePayment.query.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import ValidationError from "../../core/errors/ValidationError.js";
import { getPaginatedQueryResult } from "../../core/utils/query.js";
import { normalizeDateValue } from "../../core/utils/date.js";

const createEmployeePaymentService = async (data) => {
  const employee = await ensureEmployeeExists(data.employee);

  if (employee.status !== "active") {
    throw new ValidationError("Cannot create payment for an inactive employee");
  }

  const normalizedData = {
    ...data,
    paymentDate: normalizeDateValue(data.paymentDate),
    employeeName: employee.name,
  };

  const payment = await EmployeePayment.create(normalizedData);

  return payment.populate("employee", "name phone");
};

const getEmployeePaymentsService = async (filters = {}) => {
  const queryFilters = { ...filters };
  if (queryFilters.status === undefined) {
    queryFilters.status = "active";
  }

  return getPaginatedQueryResult(EmployeePayment, queryFilters, employeePaymentQueryConfig, {
    populate: ["employee"],
  });
};

const getEmployeePaymentByIdService = async (paymentId) => {
  const payment = await EmployeePayment.findById(paymentId).populate(
    "employee",
    "name phone",
  );

  if (!payment) {
    throw new NotFoundError("Payment not found.");
  }

  return payment;
};

const updateEmployeePaymentService = async (paymentId, updateData) => {
  const payment = await EmployeePayment.findById(paymentId);

  if (!payment) {
    throw new NotFoundError("Payment not found.");
  }

  if (payment.status === "voided") {
    throw new ValidationError("Cannot update a voided payment.");
  }

  // Only `note` may be changed after creation — all financial fields are immutable.
  if (updateData.note !== undefined) {
    payment.note = updateData.note;
  }

  await payment.save();

  return payment.populate("employee", "name phone");
};

const voidEmployeePaymentService = async (paymentId, voidReason, user) => {
  const payment = await EmployeePayment.findById(paymentId);

  if (!payment) {
    throw new NotFoundError("Payment not found.");
  }

  if (payment.status === "voided") {
    throw new ValidationError("Payment is already voided.");
  }

  payment.status = "voided";
  payment.voidReason = voidReason;
  payment.voidedBy = user.id;
  payment.voidedAt = new Date();

  await payment.save();

  return payment.populate("employee", "name phone");
};

export {
  createEmployeePaymentService,
  getEmployeePaymentsService,
  getEmployeePaymentByIdService,
  updateEmployeePaymentService,
  voidEmployeePaymentService,
};
