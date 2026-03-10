import ApiUsageLog from "../db/models/apiUsageLog.js";
import WalletTransaction from "../db/models/walletTransaction.js";
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

/**
 * GET /api/analytics/wallet
 * Wallet spend analytics
 */
export const getWalletAnalytics = async (req, res) => {
  const logger = getLoggerWithLabel("getWalletAnalytics");
  logger.info("getWalletAnalytics called");

  try {
    const user = await User.findById(req.userId);
    if (!user || !user.companyId) {
      return error(res, STATUS_CODES.BAD_REQUEST, "User or company not found");
    }

    const { from, to } = req.query;
    const filter = { companyId: user.companyId };

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const [spendOverTime, totalCredits, totalDebits] = await Promise.all([
      WalletTransaction.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              date: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              type: "$type",
            },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.date": 1 } },
      ]),
      WalletTransaction.aggregate([
        { $match: { ...filter, type: "credit" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      WalletTransaction.aggregate([
        { $match: { ...filter, type: "debit" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    return success(
      res,
      STATUS_CODES.OK,
      {
        spendOverTime,
        totalCredits: totalCredits[0]?.total || 0,
        totalDebits: totalDebits[0]?.total || 0,
      },
      "Wallet analytics fetched successfully"
    );
  } catch (err) {
    logger.error(`Error in getWalletAnalytics: ${err.message}`);
    return error(res, STATUS_CODES.INTERNAL_SERVER, err.message);
  }
};
