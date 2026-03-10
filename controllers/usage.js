import ApiUsageLog from "../db/models/apiUsageLog.js";
import User from "../db/models/user.js";
import { success, error } from "../utils/response.js";
import { STATUS_CODES } from "../utils/constants.js";
import { getLoggerWithLabel } from "../utils/logger.js";

/**
 * GET /api/api-apps/:id/usage
 * Per-app usage stats
 */
export const getAppUsage = async (req, res) => {
  const logger = getLoggerWithLabel("getAppUsage");
  logger.info("getAppUsage called");

  try {
    const appId = req.params.id;
    const { from, to } = req.query;

    const filter = { appId };
    if (from || to) {
      filter.calledAt = {};
      if (from) filter.calledAt.$gte = new Date(from);
      if (to) filter.calledAt.$lte = new Date(to);
    }

    const [totalCalls, successCalls, failCalls, avgLatency] = await Promise.all(
      [
        ApiUsageLog.countDocuments(filter),
        ApiUsageLog.countDocuments({ ...filter, statusCode: { $lt: 400 } }),
        ApiUsageLog.countDocuments({ ...filter, statusCode: { $gte: 400 } }),
        ApiUsageLog.aggregate([
          { $match: filter },
          { $group: { _id: null, avg: { $avg: "$latencyMs" } } },
        ]),
      ]
    );

    return success(
      res,
      STATUS_CODES.OK,
      {
        appId,
        totalCalls,
        successCalls,
        failCalls,
        avgLatencyMs: avgLatency[0]?.avg || 0,
      },
      "App usage fetched successfully"
    );
  } catch (err) {
    logger.error(`Error in getAppUsage: ${err.message}`);
    return error(res, STATUS_CODES.INTERNAL_SERVER, err.message);
  }
};

/**
 * GET /api/usage
 * Company-wide usage summary
 */
export const getCompanyUsage = async (req, res) => {
  const logger = getLoggerWithLabel("getCompanyUsage");
  logger.info("getCompanyUsage called");

  try {
    const user = await User.findById(req.userId);
    if (!user || !user.companyId) {
      return error(res, STATUS_CODES.BAD_REQUEST, "User or company not found");
    }

    const { from, to } = req.query;

    const filter = { companyId: user.companyId };
    if (from || to) {
      filter.calledAt = {};
      if (from) filter.calledAt.$gte = new Date(from);
      if (to) filter.calledAt.$lte = new Date(to);
    }

    const [totalCalls, callsByApp, callsByEndpoint] = await Promise.all([
      ApiUsageLog.countDocuments(filter),
      ApiUsageLog.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$appId",
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "apiapps",
            localField: "_id",
            foreignField: "_id",
            as: "app",
          },
        },
        { $unwind: { path: "$app", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            appId: "$_id",
            appName: "$app.appName",
            count: 1,
          },
        },
        { $sort: { count: -1 } },
      ]),
      ApiUsageLog.aggregate([
        { $match: filter },
        {
          $group: {
            _id: { endpoint: "$endpoint", method: "$method" },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
    ]);

    return success(
      res,
      STATUS_CODES.OK,
      {
        totalCalls,
        callsByApp,
        callsByEndpoint,
      },
      "Company usage fetched successfully"
    );
  } catch (err) {
    logger.error(`Error in getCompanyUsage: ${err.message}`);
    return error(res, STATUS_CODES.INTERNAL_SERVER, err.message);
  }
};
