import Wallet from "../db/models/wallet.js";
import WalletTransaction from "../db/models/walletTransaction.js";
import { ACTION_CHARGES, STATUS_CODES } from "../utils/constants.js";
import { error } from "../utils/response.js";
import { getLoggerWithLabel } from "../utils/logger.js";

/**
 * Middleware factory that checks wallet balance for a specific billable action.
 * Only deducts when the action has a defined charge in ACTION_CHARGES.
 *
 * Usage in routes:
 *   router.post("/shipments", oauthBearerAuth, chargeAction("create_shipment"), createShipment);
 *
 * @param {string} actionKey - The action identifier from ACTION_CHARGES (e.g. "create_shipment")
 */
export const chargeAction = (actionKey) => {
  return async function (req, res, next) {
    const logger = getLoggerWithLabel("chargeAction");

    const cost = ACTION_CHARGES[actionKey];

    // If no charge defined for this action, skip
    if (cost === undefined || cost <= 0) {
      return next();
    }

    try {
      const wallet = await Wallet.findOne({ companyId: req.companyId });

      if (!wallet) {
        return error(
          res,
          STATUS_CODES.PAYMENT_REQUIRED,
          "Wallet not found. Please set up your wallet before using this API."
        );
      }

      if (wallet.balance < cost) {
        return error(
          res,
          STATUS_CODES.PAYMENT_REQUIRED,
          `Insufficient wallet balance. This action costs ${wallet.currency} ${cost.toFixed(2)} but your balance is ${wallet.currency} ${wallet.balance.toFixed(2)}. Please top up your wallet.`
        );
      }

      // Deduct the action cost
      wallet.balance -= cost;
      await wallet.save();

      // Log the debit transaction
      await WalletTransaction.create({
        walletId: wallet._id,
        companyId: req.companyId,
        type: "debit",
        amount: cost,
        referenceId: req.appId || null,
        description: `${actionKey} (${req.method} ${req.originalUrl})`,
      });

      logger.info(
        `Charged ${cost} for "${actionKey}" | company: ${req.companyId} | remaining: ${wallet.balance.toFixed(2)}`
      );

      next();
    } catch (err) {
      logger.error(`Wallet charge error: ${err.message}`);
      return error(res, STATUS_CODES.INTERNAL_SERVER, "Internal Server Error");
    }
  };
};
