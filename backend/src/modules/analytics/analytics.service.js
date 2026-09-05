import Employee from "../employees/employee.model.js";
import Contract from "../contracts/contract.model.js";
import Order from "../orders/order.model.js";
import Purchase from "../purchases/purchase.model.js";
import CustomerPayment from "../customerPayments/customerPayment.model.js";
import EmployeePayment from "../employeePayments/employeePayment.model.js";
import ContractorPayment from "../contractorPayments/contractorPayment.model.js";
import SupplierPayment from "../supplierPayments/supplierPayment.model.js";
import Expense from "../expenses/expense.model.js";
import { normalizeDateValue } from "../../core/utils/date.js";

const getDashboardStatsService = async () => {
  const [
    activeEmployees,
    activeContracts,
    overdueContracts,
    pendingOrders,
    inProgressOrders,
    unpaidPurchases,
  ] = await Promise.all([
    Employee.countDocuments({ status: "active", deletedAt: null }),
    Contract.countDocuments({ status: "ACTIVE" }),
    Contract.countDocuments({ status: "ACTIVE", expectedCompletionDate: { $lt: normalizeDateValue(new Date()) } }),
    Order.countDocuments({ status: "pending" }),
    Order.countDocuments({ status: "in_progress" }),
    Purchase.countDocuments({ paymentStatus: "UNPAID" }),
  ]);

  return {
    activeEmployees,
    activeContracts,
    overdueContracts,
    pendingOrders,
    inProgressOrders,
    unpaidPurchases,
  };
};

const getAnalyticsReportsService = async (startDate, endDate) => {
  const matchDate = {};
  if (startDate || endDate) {
    matchDate.date = {};
    if (startDate) matchDate.date.$gte = normalizeDateValue(startDate);
    if (endDate) matchDate.date.$lte = normalizeDateValue(endDate);
  }

  const matchPaymentDate = {};
  if (startDate || endDate) {
    matchPaymentDate.paymentDate = {};
    if (startDate) matchPaymentDate.paymentDate.$gte = normalizeDateValue(startDate);
    if (endDate) matchPaymentDate.paymentDate.$lte = normalizeDateValue(endDate);
  }

  const activePaymentMatch = { ...matchPaymentDate, status: "active" };
  const activeExpenseMatch = { ...matchDate, status: "active" };

  const [
    customerPayments,
    employeePayments,
    contractorPayments,
    supplierPayments,
    expenses,
  ] = await Promise.all([
    CustomerPayment.aggregate([
      { $match: activePaymentMatch },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    EmployeePayment.aggregate([
      { $match: activePaymentMatch },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    ContractorPayment.aggregate([
      { $match: activePaymentMatch },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    SupplierPayment.aggregate([
      { $match: activePaymentMatch },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Expense.aggregate([
      { $match: activeExpenseMatch },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const cashIn = customerPayments[0]?.total || 0;
  
  const laborCost = employeePayments[0]?.total || 0;
  const contractorCost = contractorPayments[0]?.total || 0;
  const materialsCost = supplierPayments[0]?.total || 0;
  const generalExpenses = expenses[0]?.total || 0;
  
  const cashOut = laborCost + contractorCost + materialsCost + generalExpenses;

  return {
    cashFlow: {
      cashIn,
      cashOut,
      net: cashIn - cashOut,
    },
    costBreakdown: {
      laborCost,
      contractorCost,
      materialsCost,
      generalExpenses,
    },
  };
};

export {
  getDashboardStatsService,
  getAnalyticsReportsService,
};
