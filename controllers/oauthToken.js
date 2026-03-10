import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ApiApp from "../db/models/apiApp.js";
import ApiUsageLog from "../db/models/apiUsageLog.js";
import { success, error } from "../utils/response.js";
import {
  STATUS_CODES,
  SECRET_JWT_KEY,
  OAUTH_TOKEN_DURATION,
} from "../utils/constants.js";
import { getLoggerWithLabel } from "../utils/logger.js";
import { getClientIp, getGeoFromIp } from "../utils/ipGeo.js";

/**
 * POST /api/oauth-api/token
 * Exchange client_id + secret_key for a Bearer token
 */
export const issueToken = async (req, res) => {
  const logger = getLoggerWithLabel("oauthToken");
  logger.info("issueToken called");

  try {
    const { client_id, secret_key, grant_type } = req.body;

    if (grant_type !== "client_credentials") {
      return error(
        res,
        STATUS_CODES.BAD_REQUEST,
        "grant_type must be 'client_credentials'"
      );
    }

    if (!client_id || !secret_key) {
      return error(
        res,
        STATUS_CODES.BAD_REQUEST,
        "client_id and secret_key are required"
      );
    }

    // Look up app by client_id
    const app = await ApiApp.findOne({ clientId: client_id });

    if (!app) {
      logger.warn(`App not found for client_id: ${client_id}`);
      return error(res, STATUS_CODES.UNAUTHORIZED, "Invalid credentials");
    }

    if (!app.isActive) {
      logger.warn(`App is inactive: ${app._id}`);
      return error(res, STATUS_CODES.UNAUTHORIZED, "App has been revoked");
    }

    // Verify secret_key against hash
    const isMatch = await bcrypt.compare(secret_key, app.secretKeyHash);

    if (!isMatch) {
      logger.warn(`Invalid secret_key for app: ${app._id}`);
      return error(res, STATUS_CODES.UNAUTHORIZED, "Invalid credentials");
    }

    // Issue JWT
    const token = jwt.sign(
      {
        appId: app._id,
        companyId: app.companyId,
        clientId: app.clientId,
        tokenType: "oauth",
      },
      SECRET_JWT_KEY,
      { expiresIn: OAUTH_TOKEN_DURATION }
    );

    logger.info(`OAuth token issued for app: ${app._id}`);

    // Log token request as API usage
    const clientIp = getClientIp(req);
    getGeoFromIp(clientIp).then((geo) => {
      ApiUsageLog.create({
        appId: app._id,
        companyId: app.companyId,
        endpoint: req.originalUrl,
        method: req.method,
        statusCode: 200,
        latencyMs: 0,
        ipAddress: clientIp,
        location: geo || {},
      }).catch((err) => logger.error(`Failed to log token usage: ${err.message}`));
    });

    return success(
      res,
      STATUS_CODES.OK,
      {
        access_token: token,
        token_type: "Bearer",
        expires_in: 3600,
      },
      "Token issued successfully"
    );
  } catch (err) {
    logger.error(`Error in issueToken: ${err.message}`);
    return error(res, STATUS_CODES.INTERNAL_SERVER, err.message);
  }
};
