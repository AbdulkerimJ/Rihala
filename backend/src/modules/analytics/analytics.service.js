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
    unpaidPurchases,
    overdueOrders,
    ordersStatusCounts,
  ] = await Promise.all([
    Employee.countDocuments({ status: "active", deletedAt: null }),
    Contract.countDocuments({ status: "ACTIVE" }),
    Contract.countDocuments({ status: "ACTIVE", expectedCompletionDate: { $lt: normalizeDateValue(new Date()) } }),
    Purchase.countDocuments({ paymentStatus: "UNPAID" }),
    Order.countDocuments({ 
      status: { $nin: ["completed", "cancelled"] },
      expectedCompletionDate: { $lt: normalizeDateValue(new Date()) } 
    }),
    Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ])
  ]);

  const ordersByStatus = {
    pending: 0,
    in_progress: 0,
    ready: 0,
    completed: 0,
    cancelled: 0,
  };

  ordersStatusCounts.forEach(({ _id, count }) => {
    if (_id && ordersByStatus[_id] !== undefined) {
      ordersByStatus[_id] = count;
    }
  });

  return {
    activeEmployees,
    activeContracts,
    overdueContracts,
    pendingOrders: ordersByStatus.pending,
    inProgressOrders: ordersByStatus.in_progress,
    unpaidPurchases,
    overdueOrders,
    ordersByStatus,
  };
};

const getAnalyticsReportsService = async (startDate, endDate) => {
  const matchDate = {};
  if (startDate || endDate) {
    matchDate.date = {};
    if (startDate) {
      matchDate.date.$gte = new Date(startDate);
    }
    if (endDate) {
      const date = new Date(endDate);
      date.setHours(23, 59, 59, 999);
      matchDate.date.$lte = date;
    }
  }

  const matchPaymentDate = {};
  if (startDate || endDate) {
    matchPaymentDate.paymentDate = {};
    if (startDate) {
      matchPaymentDate.paymentDate.$gte = new Date(startDate);
    }
    if (endDate) {
      const date = new Date(endDate);
      date.setHours(23, 59, 59, 999);
      matchPaymentDate.paymentDate.$lte = date;
    }
  }

  const activePaymentMatch = { ...matchPaymentDate, status: "active" };
  const activeExpenseMatch = { ...matchDate, status: "active" };

  const [
    customerPayments,
    employeePayments,
    contractorPayments,
    supplierPayments,
    expenses,
    ordersStatusCounts,
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
    Order.aggregate([
      { $match: matchDate },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const cashIn = customerPayments[0]?.total || 0;
  
  const employeeCost = employeePayments[0]?.total || 0;
  const contractorCost = contractorPayments[0]?.total || 0;
  const materialsCost = supplierPayments[0]?.total || 0;
  const generalExpenses = expenses[0]?.total || 0;
  
  const cashOut = employeeCost + contractorCost + materialsCost + generalExpenses;

  const ordersByStatus = {
    pending: 0,
    in_progress: 0,
    ready: 0,
    completed: 0,
    cancelled: 0,
  };

  ordersStatusCounts.forEach(({ _id, count }) => {
    if (_id && ordersByStatus[_id] !== undefined) {
      ordersByStatus[_id] = count;
    }
  });

  return {
    cashFlow: {
      cashIn,
      cashOut,
      net: cashIn - cashOut,
    },
    costBreakdown: {
      employeeCost,
      contractorCost,
      materialsCost,
      generalExpenses,
    },
    ordersByStatus,
  };
};

const buildDateMatch = (startDate, endDate, dateField) => {
  const match = {};
  if (startDate || endDate) {
    match[dateField] = {};
    if (startDate) {
      match[dateField].$gte = new Date(startDate);
    }
    if (endDate) {
      const d = new Date(endDate);
      d.setHours(23, 59, 59, 999);
      match[dateField].$lte = d;
    }
  }
  return match;
};

const determineGrouping = (startDate, endDate) => {
  if (!startDate || !endDate) return { format: "%Y-%m", unit: "month" };
  const diffDays = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
  return diffDays <= 32 ? { format: "%Y-%m-%d", unit: "day" } : { format: "%Y-%m", unit: "month" };
};

const padDateRange = (data, startDate, endDate, valueKeys, unit) => {
  let start, end;
  
  if (!startDate && !endDate) {
    if (data.length === 0) return data;
    const sorted = [...data].sort((a, b) => a.month.localeCompare(b.month));
    start = new Date(sorted[0].month);
    end = new Date(sorted[sorted.length - 1].month);
  } else {
    start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    end = endDate ? new Date(endDate) : new Date();
  }

  const result = [];
  const dataMap = new Map(data.map(item => [item.month, item]));
  
  let current = new Date(start.getFullYear(), start.getMonth(), unit === 'day' ? start.getDate() : 1);
  const endLimit = new Date(end.getFullYear(), end.getMonth(), unit === 'day' ? end.getDate() : 1);
  
  while (current <= endLimit) {
    let dateStr;
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    
    if (unit === "day") {
      const day = String(current.getDate()).padStart(2, "0");
      dateStr = `${year}-${month}-${day}`;
    } else {
      dateStr = `${year}-${month}`;
    }
    
    if (dataMap.has(dateStr)) {
      result.push(dataMap.get(dateStr));
    } else {
      const emptyItem = { month: dateStr };
      valueKeys.forEach(key => emptyItem[key] = 0);
      result.push(emptyItem);
    }
    
    if (unit === "day") {
      current.setDate(current.getDate() + 1);
    } else {
      current.setMonth(current.getMonth() + 1);
    }
  }
  
  return result;
};

const getCashFlowTrendService = async (startDate, endDate) => {
  const matchPaymentDate = { ...buildDateMatch(startDate, endDate, "paymentDate"), status: "active" };
  const matchExpenseDate = { ...buildDateMatch(startDate, endDate, "date"), status: "active" };
  const { format, unit } = determineGrouping(startDate, endDate);

  const [customerPayments, employeePayments, contractorPayments, supplierPayments, expenses] = await Promise.all([
    CustomerPayment.aggregate([
      { $match: matchPaymentDate },
      { $group: { _id: { $dateToString: { format, date: "$paymentDate" } }, total: { $sum: "$amount" } } }
    ]),
    EmployeePayment.aggregate([
      { $match: matchPaymentDate },
      { $group: { _id: { $dateToString: { format, date: "$paymentDate" } }, total: { $sum: "$amount" } } }
    ]),
    ContractorPayment.aggregate([
      { $match: matchPaymentDate },
      { $group: { _id: { $dateToString: { format, date: "$paymentDate" } }, total: { $sum: "$amount" } } }
    ]),
    SupplierPayment.aggregate([
      { $match: matchPaymentDate },
      { $group: { _id: { $dateToString: { format, date: "$paymentDate" } }, total: { $sum: "$amount" } } }
    ]),
    Expense.aggregate([
      { $match: matchExpenseDate },
      { $group: { _id: { $dateToString: { format, date: "$date" } }, total: { $sum: "$amount" } } }
    ])
  ]);

  const monthsMap = {};
  
  const addCashIn = (arr) => {
    arr.forEach(p => {
      if (!monthsMap[p._id]) monthsMap[p._id] = { month: p._id, cashIn: 0, cashOut: 0 };
      monthsMap[p._id].cashIn += p.total;
    });
  };

  const addCashOut = (arr) => {
    arr.forEach(p => {
      if (!monthsMap[p._id]) monthsMap[p._id] = { month: p._id, cashIn: 0, cashOut: 0 };
      monthsMap[p._id].cashOut += p.total;
    });
  };

  addCashIn(customerPayments);
  addCashOut(employeePayments);
  addCashOut(contractorPayments);
  addCashOut(supplierPayments);
  addCashOut(expenses);

  const rawData = Object.values(monthsMap).sort((a, b) => a.month.localeCompare(b.month));
  return padDateRange(rawData, startDate, endDate, ["cashIn", "cashOut"], unit);
};

const getOrdersTrendService = async (startDate, endDate) => {
  const matchDate = buildDateMatch(startDate, endDate, "date");
  const { format, unit } = determineGrouping(startDate, endDate);
  
  const trends = await Order.aggregate([
    { $match: matchDate },
    { $group: { _id: { $dateToString: { format, date: "$date" } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  const rawData = trends.map(t => ({ month: t._id, count: t.count }));
  return padDateRange(rawData, startDate, endDate, ["count"], unit);
};

const getExpensesByCategoryService = async (startDate, endDate) => {
  const matchDate = { ...buildDateMatch(startDate, endDate, "date"), status: "active" };
  const categories = await Expense.aggregate([
    { $match: matchDate },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
    { $sort: { total: -1 } }
  ]);
  return categories.map(c => ({ category: c._id, total: c.total }));
};

const getPurchasesByCategoryService = async (startDate, endDate) => {
  const matchDate = buildDateMatch(startDate, endDate, "date");
  const categories = await Purchase.aggregate([
    { $match: matchDate },
    { $unwind: "$items" },
    { $group: { _id: "$items.materialCategory", total: { $sum: "$items.subtotal" } } },
    { $sort: { total: -1 } }
  ]);
  return categories.map(c => ({ category: c._id || "Other", total: c.total }));
};

const getEmployeePaymentsByTypeService = async (startDate, endDate) => {
  const matchPaymentDate = { ...buildDateMatch(startDate, endDate, "paymentDate"), status: "active" };
  
  const [employeeTypes, contractorTotal] = await Promise.all([
    EmployeePayment.aggregate([
      { $match: matchPaymentDate },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } }
    ]),
    ContractorPayment.aggregate([
      { $match: matchPaymentDate },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ])
  ]);

  const result = employeeTypes.map(t => ({ type: t._id, total: t.total }));
  
  if (contractorTotal.length > 0 && contractorTotal[0].total > 0) {
    result.push({ type: "contractor", total: contractorTotal[0].total });
  }
  
  return result;
};

const getContractorCostTrendService = async (startDate, endDate) => {
  const matchPaymentDate = { ...buildDateMatch(startDate, endDate, "paymentDate"), status: "active" };
  const { format, unit } = determineGrouping(startDate, endDate);
  
  const trends = await ContractorPayment.aggregate([
    { $match: matchPaymentDate },
    { $group: { _id: { $dateToString: { format, date: "$paymentDate" } }, total: { $sum: "$amount" } } },
    { $sort: { _id: 1 } }
  ]);
  const rawData = trends.map(t => ({ month: t._id, total: t.total }));
  return padDateRange(rawData, startDate, endDate, ["total"], unit);
};

const getEmployeeCostTrendService = async (startDate, endDate) => {
  const matchPaymentDate = { ...buildDateMatch(startDate, endDate, "paymentDate"), status: "active" };
  const { format, unit } = determineGrouping(startDate, endDate);
  
  const trends = await EmployeePayment.aggregate([
    { $match: matchPaymentDate },
    { $group: { _id: { $dateToString: { format, date: "$paymentDate" } }, total: { $sum: "$amount" } } },
    { $sort: { _id: 1 } }
  ]);
  const rawData = trends.map(t => ({ month: t._id, total: t.total }));
  return padDateRange(rawData, startDate, endDate, ["total"], unit);
};

export {
  getDashboardStatsService,
  getAnalyticsReportsService,
  getCashFlowTrendService,
  getOrdersTrendService,
  getExpensesByCategoryService,
  getPurchasesByCategoryService,
  getEmployeePaymentsByTypeService,
  getContractorCostTrendService,
  getEmployeeCostTrendService
};
