import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import bcrypt from "bcrypt";
import ApiApp from "../db/models/apiApp.js";
import User from "../db/models/user.js";
import { success, error } from "../utils/response.js";
import { STATUS_CODES, BCRYPT_SALT } from "../utils/constants.js";
import { getLoggerWithLabel } from "../utils/logger.js";

/**
 * POST /api/api-apps
 * Create a new API App - generates client_id + secret_key
 */
export const createApp = async (req, res) => {
  const logger = getLoggerWithLabel("createApp");
  logger.info("createApp called");

  try {
    const { appName, description, appFor, otherIntegration } = req.body;

    if (!appName || !description || !appFor) {
      return error(
        res,
        STATUS_CODES.BAD_REQUEST,
        "appName, description, and appFor are required"
      );
    }

    if (appFor === "other" && !otherIntegration) {
      return error(
        res,
        STATUS_CODES.BAD_REQUEST,
        "otherIntegration is required when appFor is 'other'"
      );
    }

    // Get the user's companyId
    const user = await User.findById(req.userId);
    if (!user || !user.companyId) {
      return error(res, STATUS_CODES.BAD_REQUEST, "User or company not found");
    }

    // Generate credentials
    const clientId = uuidv4();
    const secretKey = crypto.randomBytes(32).toString("hex");
    const secretKeyHash = await bcrypt.hash(secretKey, BCRYPT_SALT);

    const app = new ApiApp({
      companyId: user.companyId,
      appName,
      description,
      appFor,
      otherIntegration: appFor === "other" ? otherIntegration : undefined,
      clientId,
      secretKeyHash,
      createdBy: req.userId,
    });

    await app.save();

    logger.info(`App created: ${app._id} for company: ${user.companyId}`);

    // Return plain secret only once
    return success(
      res,
      STATUS_CODES.CREATED,
      {
        _id: app._id,
        appName: app.appName,
        description: app.description,
        appFor: app.appFor,
        otherIntegration: app.otherIntegration,
        clientId: app.clientId,
        secretKey: secretKey,
        isActive: app.isActive,
        createdAt: app.createdAt,
      },
      "App created successfully. Save your secret key - it won't be shown again."
    );
  } catch (err) {
    logger.error(`Error in createApp: ${err.message}`);
    return error(res, STATUS_CODES.INTERNAL_SERVER, err.message);
  }
};

/**
 * GET /api/api-apps
 * List all apps for the logged-in user's company
 */
export const listApps = async (req, res) => {
  const logger = getLoggerWithLabel("listApps");
  logger.info("listApps called");

  try {
    const user = await User.findById(req.userId);
    if (!user || !user.companyId) {
      return error(res, STATUS_CODES.BAD_REQUEST, "User or company not found");
    }

    const apps = await ApiApp.find({ companyId: user.companyId, isActive: true })
      .select("-secretKeyHash")
      .sort({ createdAt: -1 });

    return success(res, STATUS_CODES.OK, apps, "Apps fetched successfully");
  } catch (err) {
    logger.error(`Error in listApps: ${err.message}`);
    return error(res, STATUS_CODES.INTERNAL_SERVER, err.message);
  }
};

/**
 * GET /api/api-apps/:id
 * Get single app details
 */
export const getApp = async (req, res) => {
  const logger = getLoggerWithLabel("getApp");
  logger.info("getApp called");

  try {
    const app = await ApiApp.findById(req.params.id).select("-secretKeyHash");

    if (!app) {
      return error(res, STATUS_CODES.NOT_FOUND, "App not found");
    }

    return success(res, STATUS_CODES.OK, app, "App fetched successfully");
  } catch (err) {
    logger.error(`Error in getApp: ${err.message}`);
    return error(res, STATUS_CODES.INTERNAL_SERVER, err.message);
  }
};

/**
 * DELETE /api/api-apps/:id
 * Revoke/delete an app
 */
export const deleteApp = async (req, res) => {
  const logger = getLoggerWithLabel("deleteApp");
  logger.info("deleteApp called");

  try {
    const app = await ApiApp.findById(req.params.id);

    if (!app) {
      return error(res, STATUS_CODES.NOT_FOUND, "App not found");
    }

    app.isActive = false;
    await app.save();

    logger.info(`App revoked: ${app._id}`);
    return success(res, STATUS_CODES.OK, null, "App revoked successfully");
  } catch (err) {
    logger.error(`Error in deleteApp: ${err.message}`);
    return error(res, STATUS_CODES.INTERNAL_SERVER, err.message);
  }
};
