import { 
  getDashboardStatsService, 
  getAnalyticsReportsService,
  getCashFlowTrendService,
  getOrdersTrendService,
  getExpensesByCategoryService,
  getPurchasesByCategoryService,
  getEmployeePaymentsByTypeService,
  getContractorCostTrendService,
  getEmployeeCostTrendService
} from "./analytics.service.js";

const getDashboardStatsController = async (req, res, next) => {
  try {
    const stats = await getDashboardStatsService();
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

const getAnalyticsReportsController = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const reports = await getAnalyticsReportsService(startDate, endDate);
    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};

const getCashFlowTrendController = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await getCashFlowTrendService(startDate, endDate);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getOrdersTrendController = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await getOrdersTrendService(startDate, endDate);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getExpensesByCategoryController = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await getExpensesByCategoryService(startDate, endDate);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getPurchasesByCategoryController = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await getPurchasesByCategoryService(startDate, endDate);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getEmployeePaymentsByTypeController = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await getEmployeePaymentsByTypeService(startDate, endDate);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getContractorCostTrendController = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await getContractorCostTrendService(startDate, endDate);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getEmployeeCostTrendController = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await getEmployeeCostTrendService(startDate, endDate);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export {
  getDashboardStatsController,
  getAnalyticsReportsController,
  getCashFlowTrendController,
  getOrdersTrendController,
  getExpensesByCategoryController,
  getPurchasesByCategoryController,
  getEmployeePaymentsByTypeController,
  getContractorCostTrendController,
  getEmployeeCostTrendController
};
