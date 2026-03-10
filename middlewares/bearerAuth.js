import jwt from "jsonwebtoken";
import { SECRET_JWT_KEY, STATUS_CODES } from "../utils/constants.js";
import { error } from "../utils/response.js";
import { getLoggerWithLabel } from "../utils/logger.js";
import ApiApp from "../db/models/apiApp.js";

/**
 * Validates OAuth Bearer tokens issued via /oauth-api/token.
 * Sets req.appId, req.companyId on success.
 */
export const oauthBearerAuth = async function (req, res, next) {
  const logger = getLoggerWithLabel("oauthBearerAuth");
  logger.info("OAuth Bearer auth started");

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return error(res, STATUS_CODES.UNAUTHORIZED, "Bearer token required");
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_JWT_KEY);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return error(res, STATUS_CODES.UNAUTHORIZED, "Token expired");
      }
      return error(res, STATUS_CODES.UNAUTHORIZED, "Invalid token");
    }

    if (decoded.tokenType !== "oauth") {
      return error(res, STATUS_CODES.UNAUTHORIZED, "Invalid token type");
    }

    const app = await ApiApp.findById(decoded.appId);
    if (!app || !app.isActive) {
      return error(res, STATUS_CODES.UNAUTHORIZED, "App is revoked or not found");
    }

    req.appId = decoded.appId;
    req.companyId = decoded.companyId;
    logger.info(`OAuth token verified for app: ${decoded.appId}`);
    next();
  } catch (err) {
    logger.error(`OAuth auth error: ${err.message}`);
    return error(res, STATUS_CODES.INTERNAL_SERVER, "Internal Server Error");
  }
};
