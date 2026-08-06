import Payment from "./payment.model.js";
import { ensureEmployeeExists } from "../employees/employee.service.js";
import paymentQueryConfig from "./payment.query.js";
import NotFoundError from "../../core/errors/NotFoundError.js";
import ValidationError from "../../core/errors/ValidationError.js";
import { getPaginatedQueryResult } from "../../core/utils/query.js";
import { normalizeDateValue } from "../../core/utils/date.js";

const createPaymentService = async (data) => {
  const employee = await ensureEmployeeExists(data.employee);

  if (employee.status !== "active") {
    throw new ValidationError("Cannot create payment for an inactive employee");
  }

  const normalizedData = {
    ...data,
    paymentDate: normalizeDateValue(data.paymentDate),
    employeeName: employee.name,
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

  if (updateData.paymentDate) {
    updateData.paymentDate = normalizeDateValue(updateData.paymentDate);
  }

  Object.keys(updateData).forEach((key) => {
    payment[key] = updateData[key];
  });

  await payment.save();

  return payment.populate("employee", "name phone");
};

export {
  createPaymentService,
  getPaymentsService,
  getPaymentByIdService,
  updatePaymentService,
};
