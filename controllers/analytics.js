import ApiUsageLog from "../db/models/apiUsageLog.js";
import User from "../db/models/user.js";
import { success, error } from "../utils/response.js";
import { STATUS_CODES } from "../utils/constants.js";
import { getLoggerWithLabel } from "../utils/logger.js";

/**
 * GET /api/analytics/api-usage
 * API call trends over time
 */
export const getApiUsageAnalytics = async (req, res) => {
  const logger = getLoggerWithLabel("getApiUsageAnalytics");
  logger.info("getApiUsageAnalytics called");

  try {
    const user = await User.findById(req.userId);
    if (!user || !user.companyId) {
      return error(res, STATUS_CODES.BAD_REQUEST, "User or company not found");
    }

    const { from, to, app_id } = req.query;
    const filter = { companyId: user.companyId };

    if (app_id) filter.appId = app_id;
    if (from || to) {
      filter.calledAt = {};
      if (from) filter.calledAt.$gte = new Date(from);
      if (to) filter.calledAt.$lte = new Date(to);
    }

    const [callsOverTime, statusBreakdown, latencyOverTime] =
      await Promise.all([
        ApiUsageLog.aggregate([
          { $match: filter },
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
          { $match: filter },
          {
            $group: {
              _id: {
                $switch: {
                  branches: [
                    {
                      case: { $lt: ["$statusCode", 300] },
                      then: "2xx",
                    },
                    {
                      case: { $lt: ["$statusCode", 400] },
                      then: "3xx",
                    },
                    {
                      case: { $lt: ["$statusCode", 500] },
                      then: "4xx",
                    },
                  ],
                  default: "5xx",
                },
              },
              count: { $sum: 1 },
            },
          },
        ]),
        ApiUsageLog.aggregate([
          { $match: filter },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$calledAt" },
              },
              avgLatency: { $avg: "$latencyMs" },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

    return success(
      res,
      STATUS_CODES.OK,
      { callsOverTime, statusBreakdown, latencyOverTime },
      "API usage analytics fetched successfully"
    );
  } catch (err) {
    logger.error(`Error in getApiUsageAnalytics: ${err.message}`);
    return error(res, STATUS_CODES.INTERNAL_SERVER, err.message);
  }
};
