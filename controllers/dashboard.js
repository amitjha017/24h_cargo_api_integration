import ApiApp from "../db/models/apiApp.js";
import ApiUsageLog from "../db/models/apiUsageLog.js";
import User from "../db/models/user.js";
import { success, error } from "../utils/response.js";
import { STATUS_CODES } from "../utils/constants.js";
import { getLoggerWithLabel } from "../utils/logger.js";

/**
 * GET /api/dashboard
 * Overview stats: apps count, total API calls
 */
export const getDashboard = async (req, res) => {
  const logger = getLoggerWithLabel("getDashboard");
  logger.info("getDashboard called");

  try {
    const user = await User.findById(req.userId);
    if (!user || !user.companyId) {
      return error(res, STATUS_CODES.BAD_REQUEST, "User or company not found");
    }

    const companyId = user.companyId;

    const [appsCount, activeAppsCount, totalApiCalls] =
      await Promise.all([
        ApiApp.countDocuments({ companyId }),
        ApiApp.countDocuments({ companyId, isActive: true }),
        ApiUsageLog.countDocuments({ companyId }),
      ]);

    return success(
      res,
      STATUS_CODES.OK,
      {
        apps: {
          total: appsCount,
          active: activeAppsCount,
        },
        apiCalls: {
          total: totalApiCalls,
        },
      },
      "Dashboard data fetched successfully"
    );
  } catch (err) {
    logger.error(`Error in getDashboard: ${err.message}`);
    return error(res, STATUS_CODES.INTERNAL_SERVER, err.message);
  }
};

/**
 * GET /api/dashboard/summary
 * Aggregated metrics: calls per day (last 30 days), top endpoints
 */
export const getDashboardSummary = async (req, res) => {
  const logger = getLoggerWithLabel("getDashboardSummary");
  logger.info("getDashboardSummary called");

  try {
    const user = await User.findById(req.userId);
    if (!user || !user.companyId) {
      return error(res, STATUS_CODES.BAD_REQUEST, "User or company not found");
    }

    const companyId = user.companyId;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [callsPerDay, topEndpoints, recentApps] = await Promise.all([
      ApiUsageLog.aggregate([
        {
          $match: {
            companyId: companyId,
            calledAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$calledAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      ApiUsageLog.aggregate([
        {
          $match: {
            companyId: companyId,
            calledAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: { endpoint: "$endpoint", method: "$method", appId: "$appId" },
            count: { $sum: 1 },
            avgLatency: { $avg: "$latencyMs" },
            lastCalled: { $max: "$calledAt" },
            successCount: {
              $sum: { $cond: [{ $lt: ["$statusCode", 400] }, 1, 0] },
            },
            failCount: {
              $sum: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] },
            },
            lastIp: { $last: "$ipAddress" },
            lastLocation: { $last: "$location" },
          },
        },
        {
          $lookup: {
            from: "apiapps",
            localField: "_id.appId",
            foreignField: "_id",
            as: "app",
          },
        },
        {
          $project: {
            _id: 0,
            endpoint: "$_id.endpoint",
            method: "$_id.method",
            appName: { $ifNull: [{ $arrayElemAt: ["$app.appName", 0] }, "Unknown"] },
            count: 1,
            avgLatency: 1,
            lastCalled: 1,
            successCount: 1,
            failCount: 1,
            lastIp: 1,
            lastLocation: 1,
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      ApiApp.find({ companyId })
        .select("appName isActive createdAt")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    return success(
      res,
      STATUS_CODES.OK,
      {
        callsPerDay,
        topEndpoints,
        recentApps,
      },
      "Dashboard summary fetched successfully"
    );
  } catch (err) {
    logger.error(`Error in getDashboardSummary: ${err.message}`);
    return error(res, STATUS_CODES.INTERNAL_SERVER, err.message);
  }
};
