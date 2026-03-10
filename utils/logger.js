import { createLogger, format, transports } from "winston";
const { combine, timestamp, label, printf } = format;
import moment from "moment";

let lastLoggedEndpoint = null;

const customFormat = printf(({ level, message, label }) => {
  const currentTimestamp = moment()
    .utc()
    .format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
  let logMessage = "";

  if (lastLoggedEndpoint !== label) {
    lastLoggedEndpoint = label;
    logMessage = `${currentTimestamp} [${label}] ${level}: ${message}`;
  } else {
    logMessage = `  ${level}: ${message}`;
  }

  return logMessage;
});

const logger = createLogger({
  format: combine(
    timestamp(),
    label({ label: "default" }),
    customFormat
  ),
  transports: [new transports.File({ filename: "application.log" })],
});

export const getLoggerWithLabel = (endpointName) => {
  return logger.child({ label: endpointName });
};
