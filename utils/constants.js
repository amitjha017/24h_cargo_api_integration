export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDEN: 403,
  PAYMENT_REQUIRED: 402,
  NOT_FOUND: 404,
  INTERNAL_SERVER: 500,
};

import dotenv from "dotenv";
dotenv.config();

import { getLoggerWithLabel } from "./logger.js";

const logger = getLoggerWithLabel("api-integration");

export const DB_URI =
  process.env.IS_PROD === "true"
    ? process.env.PROD_DB_URI
    : process.env.DEV_DB_URI;
logger.info(`DB_URI: ${DB_URI}`);
console.log(`DB_URI: ${DB_URI}`);

export const PORT = process.env.PORT || 4108;

export const SECRET_JWT_KEY = "secretaf";

export const ACCESS_JWT_DURATION = "30m";

export const REFRESH_JWT_DURATION = "3d";

export const RESET_JWT_DURATION = "30m";

export const BCRYPT_SALT = 12;

export const OAUTH_TOKEN_DURATION = "1h";

// Per-action charges (only specific actions are billable)
// key = action identifier, value = cost in wallet currency (USD)
export const ACTION_CHARGES = {
  create_shipment: 1.00,
  // Add more billable actions here as needed
  // e.g. create_package: 0.50,
  // e.g. generate_label: 0.25,
};

export const JWT_TYPES = {
  ACCESS_JWT: "access",
  REFRESH_JWT: "refresh",
  RESET_JWT: "reset",
  OAUTH_JWT: "oauth",
};
