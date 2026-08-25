import { getDashboardStatsService, getAnalyticsReportsService } from "./analytics.service.js";

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

export {
  getDashboardStatsController,
  getAnalyticsReportsController,
};
