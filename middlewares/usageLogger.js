import ApiUsageLog from "../db/models/apiUsageLog.js";
import { getLoggerWithLabel } from "../utils/logger.js";
import { getClientIp, getGeoFromIp } from "../utils/ipGeo.js";

/**
 * Middleware to log every API call made with an OAuth token.
 * Must be placed AFTER oauthBearerAuth middleware.
 */
export const usageLogger = async function (req, res, next) {
  const logger = getLoggerWithLabel("usageLogger");
  const startTime = Date.now();
  const clientIp = getClientIp(req);

  res.on("finish", async () => {
    try {
      const latencyMs = Date.now() - startTime;
      const geo = await getGeoFromIp(clientIp);

      await ApiUsageLog.create({
        appId: req.appId,
        companyId: req.companyId,
        endpoint: req.originalUrl,
        method: req.method,
        statusCode: res.statusCode,
        latencyMs: latencyMs,
        ipAddress: clientIp,
        location: geo || {},
      });
    } catch (err) {
      logger.error(`Failed to log usage: ${err.message}`);
    }
  });

  next();
};
