import Payment from "./payment.model.js";
import Employee from "../employees/employee.model.js";
import paymentQueryConfig from "./payment.query.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import { getPaginatedQueryResult } from "../../core/utils/query.js";

const normalizeDateValue = (value) => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate;
};

const ensureEmployeeExists = async (employeeId) => {
  const employee = await Employee.findById(employeeId);

  if (!employee) {
    throw new NotFoundError("Employee not found.");
  }

  return employee;
};

const createPaymentService = async (data) => {
  await ensureEmployeeExists(data.employee);

  const normalizedData = {
    ...data,
    paymentDate: normalizeDateValue(data.paymentDate),
  };

  const payment = await Payment.create(normalizedData);

  return payment.populate("employee", "name phone");
};

const getPaymentsService = async (filters = {}) => {
  return getPaginatedQueryResult(Payment, filters, paymentQueryConfig, {
    populate: ["employee"],
  });
};

const getPaymentByIdService = async (paymentId) => {
  const payment = await Payment.findById(paymentId).populate(
    "employee",
    "name phone",
  );

  if (!payment) {
    throw new NotFoundError("Payment not found.");
  }

  return payment;
};

const updatePaymentService = async (paymentId, updateData) => {
  const payment = await Payment.findById(paymentId);

  if (!payment) {
    throw new NotFoundError("Payment not found.");
  }

  if (updateData.employee) {
    await ensureEmployeeExists(updateData.employee);
  }

  if (updateData.paymentDate) {
    updateData.paymentDate = normalizeDateValue(updateData.paymentDate);
  }

  Object.keys(updateData).forEach((key) => {
    payment[key] = updateData[key];
  });

  await payment.save();

  return payment.populate("employee", "name phone");
};

const deletePaymentService = async (paymentId) => {
  const payment = await Payment.findById(paymentId);

  if (!payment) {
    throw new NotFoundError("Payment not found.");
  }

  await Payment.deleteOne({ _id: paymentId });

  return payment;
};

export {
  createPaymentService,
  getPaymentsService,
  getPaymentByIdService,
  updatePaymentService,
  deletePaymentService,
};
