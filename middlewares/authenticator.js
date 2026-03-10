import jwt from "jsonwebtoken";
import { SECRET_JWT_KEY, STATUS_CODES } from "../utils/constants.js";
import { getLoggerWithLabel } from "../utils/logger.js";

/**
 * Validates the standard user Bearer token (from 24h_cargo_auth login).
 * Sets req.userId on success.
 */
export const authentication = async function (req, res, next) {
  const logger = getLoggerWithLabel("authentication");
  logger.info("Authentication started");
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      logger.info("Verify Bearer Token in headers");
      token = req.headers.authorization.split(" ")[1];
    } else {
      logger.warn(
        `Response status: ${STATUS_CODES.UNAUTHORIZED}, Message: Authentication Token not found`
      );
      return res
        .status(STATUS_CODES.UNAUTHORIZED)
        .json({ error: "Authentication Token not found" });
    }
    jwt.verify(token, SECRET_JWT_KEY, function (error, decodedToken) {
      if (error) {
        if (error.name === "TokenExpiredError") {
          logger.warn("Token expired");
          return res.status(STATUS_CODES.UNAUTHORIZED).send({
            status: false,
            msg: "Token expired! Please log in again.",
          });
        } else {
          logger.info("Token is invalid");
          return res.status(STATUS_CODES.UNAUTHORIZED).send({
            status: false,
            msg: "Token is invalid!",
          });
        }
      }

      if (decodedToken && decodedToken.userId) {
        req.userId = decodedToken.userId;
        logger.info("Token verified. Proceeding to next handler");
        next();
      } else {
        logger.info("Invalid token structure");
        return res.status(STATUS_CODES.UNAUTHORIZED).send({
          status: false,
          msg: "Invalid token structure!",
        });
      }
    });
  } catch (err) {
    logger.error(`Error occurred: ${err.message}`);
    res
      .status(STATUS_CODES.INTERNAL_SERVER)
      .send({ msg: "Internal Server Error", error: err.message });
  }
};
