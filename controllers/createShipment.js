import { error, success } from "../utils/response.js";
import { STATUS_CODES } from "../utils/constants.js";
import amqp from "amqplib";
import { getLoggerWithLabel } from "../utils/logger.js";
import mongoose from "mongoose";
import { getNextSequenceValue } from "./sequence.js";
import Address from "../db/models/address.js";
import User from "../db/models/user.js";
import { createUser } from "../services/userApiCall.js";
import Customer from "../db/models/customer.js";
import Shipment from "../db/models/shipment.js";
import Role from "../db/models/role.js";
import Sender from "../db/models/sender.js";
import Country from "../db/models/country.js";
import { htmlContentShipment } from "../utils/templates.js";

const { OK, BAD_REQUEST, INTERNAL_SERVER } = STATUS_CODES;

const URL_RABBIT_MQ = "amqp://guest:guest@localhost:5672/";
const MAIL_QUEUE = "mailer_queue";

const createCustomerWithAddress = async ({ customerData, companyId, session }) => {
  try {
    const customerCode = await getNextSequenceValue("customerseq", "CUST-");

    const customer = new Customer({
      ...customerData,
      companyId,
      customerCode,
      status: "active",
      customerType: "Person",
    });

    await customer.save({ session });

    const address = new Address({
      address: customerData.address,
      customerId: customer._id,
      countryId: customerData.countryId,
      countryName: customerData.countryName,
      stateId: customerData.stateId,
      stateName: customerData.stateName,
      cityId: customerData.cityId,
      cityName: customerData.cityName,
      status: "active",
      addressType: "primary",
      default: true,
    });

    await address.save({ session });
    return customer;
  } catch (err) {
    if (err?.code === 11000 || err?.errorResponse?.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0];
      const value = err.keyValue?.[field];
      return { error: `${field}: ${value} already exists` };
    }
    return null;
  }
};

const createCustomerUserViaAPI = async ({ customer, address, authToken }) => {
  const customerRoleId = await Role.findOne({ name: "customer" });
  const payload = {
    firstname: customer?.firstName,
    lastname: customer?.lastName,
    email: customer?.email,
    phone: customer?.phone,
    roleId: customerRoleId?._id,
    address,
    customerId: customer?._id,
  };

  const response = await createUser(payload, authToken);
  if (response?.error) {
    throw new Error(response.error);
  }
  return response;
};

const sendEmailShipCreate = async ({ email, customer, shipment }) => {
  try {
    const conn = await amqp.connect(URL_RABBIT_MQ);
    const ch = await conn.createChannel();
    await ch.assertQueue(MAIL_QUEUE);

    const html = htmlContentShipment({ customer, shipment });

    ch.sendToQueue(
      MAIL_QUEUE,
      Buffer.from(
        JSON.stringify({
          email,
          subject: "Shipment created successfully!",
          html,
        })
      ),
      { persistent: true }
    );

    await ch.close();
    await conn.close();
  } catch (err) {
    // Silently fail — email is non-critical
  }
};

const preparePersonDetails = (customer, address) => ({
  senderId: customer._id,
  firstName: customer.firstName,
  lastName: customer.lastName,
  email: customer.email,
  phone: customer.phone,
  address: address?.address,
  countryId: address?.countryId,
  stateId: address?.stateId,
  cityId: address?.cityId,
  postalCode: address?.postalCode,
});

const upsertSenderRecipient = async ({ senderId, senderDetails, recipient, session }) => {
  await Sender.updateOne(
    { senderId },
    { $setOnInsert: { senderId, ...senderDetails } },
    { upsert: true, session }
  );

  if (recipient?.email) {
    await Sender.updateOne(
      { senderId, "recieptents.email": { $ne: recipient.email } },
      {
        $push: {
          recieptents: { ...recipient, addedAt: new Date() },
        },
      },
      { session }
    );
  }
};

const resolveSenderDetails = async ({ senderId }) => {
  if (senderId) {
    const customer = await Customer.findById(senderId);
    if (!customer) return null;

    const address = await Address.findOne({
      customerId: senderId,
      default: true,
      status: "active",
    });

    return preparePersonDetails(customer, address);
  }
  return null;
};

/**
 * POST /api/create-shipment
 * Create a new shipment via OAuth API.
 * Uses req.companyId from OAuth bearer token.
 */
export const createShipmentVersion2 = async (req, res) => {
  const logger = getLoggerWithLabel("createShipmentVersion2");
  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    logger.info("createShipmentVersion2 api called");
    logger.info(`Request method: ${req.method}, URL: ${req.originalUrl}`);

    const companyId = req.companyId;
    if (!companyId) {
      await session.abortTransaction();
      return error(res, BAD_REQUEST, "Company not found");
    }

    let senderDetails;
    let senderCustomer;

    /* ---------------- SENDER CREATION ---------------- */
    logger.info("--------------- SENDER CREATION ----------------");
    if (!req.body.senderId && req.body.senderDetails) {
      senderCustomer = await createCustomerWithAddress({
        customerData: req.body.senderDetails,
        companyId,
        session,
      });

      if (!senderCustomer || senderCustomer?.error) {
        await session.abortTransaction();
        return error(res, BAD_REQUEST, senderCustomer?.error);
      }

      senderDetails = preparePersonDetails(senderCustomer, req.body.senderDetails);
    } else {
      senderDetails = await resolveSenderDetails({ senderId: req.body.senderId });
      if (!senderDetails) {
        await session.abortTransaction();
        return error(res, BAD_REQUEST, "Invalid senderId");
      }
    }

    await upsertSenderRecipient({
      senderId: req.body.senderId ?? senderCustomer?._id,
      senderDetails: req.body.senderDetails,
      recipient: req?.body?.recieptentDetails,
      session,
    });

    /* ---------------- SHIPMENT CREATION ---------------- */
    logger.info("--------------- SHIPMENT CREATION ----------------");

    const shipmentCode = await getNextSequenceValue("shipmentsequence", "SHIPMENT");

    const createNewShipment = {
      ...req.body,
      shipmentCode,
      senderDetails,
      recieptentDetails: req?.body?.recieptentDetails,
      customerId: senderDetails.senderId,
      companyId,
      totalAmount: req.body.totalAmount,
      shipmentStatus: {
        currentStatus: "created",
        status: [
          {
            name: "created",
            dateTime: new Date(),
            type: "externel",
          },
        ],
      },
      isPaid: true,
    };

    if (createNewShipment.weight > createNewShipment.vol) {
      createNewShipment.chargebleWeight = createNewShipment.weight;
    }
    if (createNewShipment.weight < createNewShipment.vol) {
      createNewShipment.chargebleWeight = createNewShipment.vol;
    }

    const originCountryExist = await Country.findById(req.body.origin.originCountryId);
    if (!originCountryExist) {
      await session.abortTransaction();
      return error(res, BAD_REQUEST, "Origin country not found");
    }

    createNewShipment.origin.originId = originCountryExist._id;
    createNewShipment.origin.countryShortName = originCountryExist.countryShortName;
    createNewShipment.origin.countryCode = originCountryExist.iso2;
    createNewShipment.origin.countryName = originCountryExist.name;
    createNewShipment.origin.numericCode = originCountryExist.numeric_code;
    createNewShipment.origin.currency = originCountryExist.currency;
    createNewShipment.origin.currencySymbol = originCountryExist.currency_symbol;

    const destinationCountryExist = await Country.findById(req.body.destination.destinationCountryId);
    if (!destinationCountryExist) {
      await session.abortTransaction();
      return error(res, BAD_REQUEST, "Destination country not found");
    }

    createNewShipment.destination.countryId = destinationCountryExist._id;
    createNewShipment.destination.countryName = destinationCountryExist.name;
    createNewShipment.destination.countryCode = destinationCountryExist.iso2;
    createNewShipment.destination.numericCode = destinationCountryExist.numeric_code;
    createNewShipment.destination.currency = destinationCountryExist.currency;
    createNewShipment.destination.currencySymbol = destinationCountryExist.currency_symbol;

    createNewShipment.currency = originCountryExist?.currency;
    createNewShipment.unitOfweight = originCountryExist?.mesaurementUnitDetails?.weightUnit;
    createNewShipment.unitOfMeasurement = originCountryExist?.mesaurementUnitDetails?.measurementUnit;

    const shipment = new Shipment(createNewShipment);
    const shipRes = await shipment.save({ session });

    logger.info(`Shipment saved: ${shipRes._id}`);

    if (!req.body.senderId && req.body.senderDetails) {
      await createCustomerUserViaAPI({
        customer: senderDetails,
        address: req.body.senderDetails.address,
        authToken: req.headers.authorization,
      });
    }

    await session.commitTransaction();
    session.endSession();

    await sendEmailShipCreate({
      email: senderDetails.email,
      customer: senderDetails,
      shipment: shipRes,
    });

    return success(res, OK, shipment, "Shipment created successfully");
  } catch (err) {
    logger.error("error in creating shipment", err);
    await session.abortTransaction();
    session.endSession();
    return error(res, INTERNAL_SERVER, err.message || "Something went wrong");
  }
};
