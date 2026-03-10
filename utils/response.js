import { STATUS_CODES } from "./constants.js";

export const success = (res, status, data, message) => {
  var response = {
    success: true,
    code: status,
    message: message,
  };
  if (data !== "" && data !== undefined) {
    response.data = data;
  }

  res.status(status).json(response);
};

export const error = (res, status, message) => {
  res.status(status).json({
    success: false,
    code: status,
    message: message,
  });
};

export const emptySuccess = (req, res, status = STATUS_CODES.OK) => {
  res.status(status).json({
    success: true,
    code: status,
  });
};
