import mongoose from "mongoose";
import Rate from "../db/models/rate.js";
import { success, error } from "../utils/response.js";
import { STATUS_CODES } from "../utils/constants.js";
import { getLoggerWithLabel } from "../utils/logger.js";

/**
 * POST /api/get-rates
 * Get shipping rates based on origin, destination and weight.
 * Uses OAuth token — companyId comes from req.companyId.
 *
 * Body: { originCode, destinationCode, volumetric_weight }
 */
export const getRates = async function (req, res) {
  const logger = getLoggerWithLabel("getRates");
  logger.info("getRates API called");

  try {
    const { originCode, destinationCode, volumetric_weight } = req.body;

    if (!originCode || !destinationCode || !volumetric_weight) {
      return success(res, STATUS_CODES.OK, [], "originCode, destinationCode and volumetric_weight are required");
    }

    const companyId = new mongoose.Types.ObjectId(req.companyId);
    const roundedWeight = Math.ceil(volumetric_weight);

    // Step 1: Try exact weight match
    let rateDetails = await fetchRates(companyId, originCode, destinationCode, {
      $eq: [{ $toDouble: "$weightValue" }, roundedWeight],
    });

    // Step 2: If no exact match, try next higher weight
    if (rateDetails.length === 0) {
      logger.info(`No exact match for weight: ${roundedWeight}. Trying next higher weight.`);

      const nextWeight = await Rate.aggregate([
        {
          $match: {
            companyId,
            isDeleted: false,
            originCode,
            destinationCode,
            $expr: { $gt: [{ $toDouble: "$weightValue" }, roundedWeight] },
          },
        },
        { $sort: { weightValue: 1 } },
        { $limit: 1 },
      ]);

      if (nextWeight.length > 0) {
        const nextWeightVal = Math.ceil(nextWeight[0].weightValue);
        logger.info(`Fetching rates for next higher weight: ${nextWeightVal}`);

        rateDetails = await fetchRates(companyId, originCode, destinationCode, {
          $eq: [{ $toDouble: "$weightValue" }, nextWeightVal],
        });
      }
    }

    // Step 3: If still no match, try nearest lower weight
    if (rateDetails.length === 0) {
      logger.info(`No higher weight found. Trying nearest lower weight.`);

      const lowerWeight = await Rate.aggregate([
        {
          $match: {
            companyId,
            isDeleted: false,
            originCode,
            destinationCode,
            $expr: { $lt: [{ $toDouble: "$weightValue" }, roundedWeight] },
          },
        },
        { $addFields: { weightValueNum: { $toDouble: "$weightValue" } } },
        { $sort: { weightValueNum: -1 } },
        { $limit: 1 },
      ]);

      if (lowerWeight.length > 0) {
        const lowerWeightVal = Math.ceil(lowerWeight[0].weightValue);
        logger.info(`Fetching rates for nearest lower weight: ${lowerWeightVal}`);

        rateDetails = await fetchRates(companyId, originCode, destinationCode, {
          $eq: [{ $toDouble: "$weightValue" }, lowerWeightVal],
        });
      }
    }

    if (rateDetails.length === 0) {
      logger.info("No rates found");
      return success(res, STATUS_CODES.OK, [], "Rates not found");
    }

    logger.info("Rates fetched successfully");
    return success(res, STATUS_CODES.OK, rateDetails, "Rates fetched successfully");
  } catch (err) {
    logger.error(`Error in getRates: ${err.message}`);
    return error(res, STATUS_CODES.INTERNAL_SERVER, err.message);
  }
};

/**
 * Helper: Aggregate rates with extra charges and service type lookup
 */
async function fetchRates(companyId, originCode, destinationCode, weightExpr) {
  return Rate.aggregate([
    {
      $match: {
        companyId,
        isDeleted: false,
        originCode,
        destinationCode,
        $expr: weightExpr,
      },
    },
    {
      $lookup: {
        from: "extracharges",
        let: { tokenCompanyId: companyId },
        pipeline: [
          { $match: { $expr: { $eq: ["$companyId", "$$tokenCompanyId"] } } },
        ],
        as: "extrachargesrates",
      },
    },
    {
      $lookup: {
        from: "servicetypes",
        localField: "serviceTypeId",
        foreignField: "_id",
        as: "serviceTypeDetails",
      },
    },
    {
      $project: {
        _id: 0,
        transiteDays: 1,
        handlingFee: 1,
        insurancePercentage: 1,
        weightUnit: 1,
        weightValue: 1,
        origin: 1,
        originCode: 1,
        destination: 1,
        destinationCode: 1,
        rateType: 1,
        accountPrice: 1,
        publicPrice: 1,
        accountFreightPrice: {
          $add: [{ $toDouble: "$accountPrice" }, { $toDouble: "$handlingFee" }],
        },
        publicFreightPrice: {
          $add: [{ $toDouble: "$publicPrice" }, { $toDouble: "$handlingFee" }],
        },
        serviceType: {
          name: { $arrayElemAt: ["$serviceTypeDetails.name", 0] },
          description: { $arrayElemAt: ["$serviceTypeDetails.description", 0] },
        },
        shipmentDeclarationTaxSlab: {
          $map: {
            input: "$shipmentDeclarationTaxSlab",
            as: "slab",
            in: {
              shipmentTaxFrom: "$$slab.shipmentTaxFrom",
              shipmentTaxTo: "$$slab.shipmentTaxTo",
              shipmentTaxPercentege: "$$slab.shipmentTaxPercentege",
            },
          },
        },
        extraRateCharges: {
          $map: {
            input: "$extrachargesrates",
            as: "charge",
            in: {
              extraRateChargesName: "$$charge.rateChargesName",
              extraRateChargesType: "$$charge.rateChargesType",
              extraRateChargesValue: "$$charge.rateChargesValue",
              extraRateChargesDefault: "$$charge.default",
              extraRateChargesDescription: "$$charge.description",
            },
          },
        },
      },
    },
  ]);
}
