import { body, validationResult } from "express-validator";
import { STATUS_CODES } from "../utils/constants.js";

const { BAD_REQUEST } = STATUS_CODES;

const requiredMongoId = (field, message) =>
  body(field)
    .notEmpty()
    .withMessage(message || `${field} is required`)
    .isMongoId()
    .withMessage(`Invalid ${field}`);

const optionalMongoId = (field, message) =>
  body(field)
    .optional({ checkFalsy: true })
    .isMongoId()
    .withMessage(message || `Invalid ${field}`);

export const createShipmentInput = [
  optionalMongoId("senderId", "Invalid senderId"),
  optionalMongoId("recieptentId", "Invalid recieptentId"),

  // Shipment core
  body("weight").isFloat({ gt: 0 }),
  body("length").isFloat({ gt: 0 }),
  body("breadth").isFloat({ gt: 0 }),
  body("height").isFloat({ gt: 0 }),
  body("vol").optional().isFloat({ gt: 0 }),
  body("declaredValue").isNumeric(),
  body("description").optional(),
  body("paymentMethod")
    .notEmpty()
    .isIn(["cod", "prepaid", "cash"])
    .withMessage("Invalid payment method"),

  // Origin & Destination
  body("origin.originCountryId").notEmpty().isMongoId(),
  body("destination.destinationCountryId").notEmpty().isMongoId(),

  // Service & Pricing
  body("serviceType").isMongoId(),
  body("selectedService").notEmpty(),
  body("selectedService.id").isMongoId(),
  body("selectedService.accountPrice").isNumeric(),
  body("selectedService.publicFreightPrice").isNumeric(),
  body("servicePrice").isNumeric(),
  body("totalAmount").isNumeric(),
  body("handleFee").isNumeric(),
  body("insuranceAmount").isNumeric(),
  body("declaredTaxValue").isNumeric(),
  body("declaredTax").isNumeric(),
  body("insuranceTax").isNumeric(),
  body("publicPrice").isNumeric(),
  body("accountPrice").isNumeric(),
  body("extraCharge.value").isNumeric(),
  body("discount.value").isNumeric(),

  // Sender/Receiver email & phone must differ
  body("recieptentDetails.email")
    .custom((value, { req }) => {
      const senderEmail = req.body.senderDetails?.email;
      if (!senderEmail || !value) return true;
      return senderEmail.toLowerCase() !== value.toLowerCase();
    })
    .withMessage("Sender and receiver email must be different"),
  body("recieptentDetails.phone")
    .custom((value, { req }) => {
      const senderPhone = req.body.senderDetails?.phone;
      if (!senderPhone || !value) return true;
      return senderPhone !== value;
    })
    .withMessage("Sender and receiver phone must be different"),
];

export const inputValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(BAD_REQUEST).json({
      success: false,
      errors: errors.array().map((err) => ({
        ...err,
        message: err.msg,
        msg: undefined,
      })),
    });
  }
  next();
};
