import axios from "axios";
import { getLoggerWithLabel } from "./logger.js";

const logger = getLoggerWithLabel("ipGeo");

/**
 * Extract client IP from request
 */
export const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip || "unknown";
};

/**
 * Lookup geo location from IP using free ip-api.com
 * Returns { country, city, region } or null on failure
 */
export const getGeoFromIp = async (ip) => {
  try {
    // Skip for localhost/private IPs
    if (!ip || ip === "unknown" || ip === "::1" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
      return { country: "Localhost", city: "Localhost", region: "" };
    }

    const res = await axios.get(`http://ip-api.com/json/${ip}?fields=country,city,regionName`, {
      timeout: 3000,
    });

    if (res.data && res.data.country) {
      return {
        country: res.data.country,
        city: res.data.city || "",
        region: res.data.regionName || "",
      };
    }
    return null;
  } catch (err) {
    logger.error(`Geo lookup failed for IP ${ip}: ${err.message}`);
    return null;
  }
};
