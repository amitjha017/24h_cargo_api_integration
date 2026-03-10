import Wallet from "../db/models/wallet.js";
import WalletTransaction from "../db/models/walletTransaction.js";
import User from "../db/models/user.js";
import { success, error } from "../utils/response.js";
import { STATUS_CODES, ACTION_CHARGES } from "../utils/constants.js";
import { getLoggerWithLabel } from "../utils/logger.js";

/**
 * GET /api/wallet
 * Get current wallet balance
 */
export const getWallet = async (req, res) => {
  const logger = getLoggerWithLabel("getWallet");
  logger.info("getWallet called");

  try {
    const user = await User.findById(req.userId);
    if (!user || !user.companyId) {
      return error(res, STATUS_CODES.BAD_REQUEST, "User or company not found");
    }

    let wallet = await Wallet.findOne({ companyId: user.companyId });

    // Auto-create wallet if it doesn't exist
    if (!wallet) {
      wallet = await Wallet.create({
        companyId: user.companyId,
        balance: 0,
        currency: "USD",
      });
    }

    return success(res, STATUS_CODES.OK, {
      ...wallet.toObject(),
      actionCharges: ACTION_CHARGES,
    }, "Wallet fetched successfully");
  } catch (err) {
    logger.error(`Error in getWallet: ${err.message}`);
    return error(res, STATUS_CODES.INTERNAL_SERVER, err.message);
  }
};

/**
 * GET /api/wallet/transactions
 * Transaction history
 */
export const getTransactions = async (req, res) => {
  const logger = getLoggerWithLabel("getTransactions");
  logger.info("getTransactions called");

  try {
    const user = await User.findById(req.userId);
    if (!user || !user.companyId) {
      return error(res, STATUS_CODES.BAD_REQUEST, "User or company not found");
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      WalletTransaction.find({ companyId: user.companyId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      WalletTransaction.countDocuments({ companyId: user.companyId }),
    ]);

    res.set("X-Total-Records", total);
    res.set("X-Current-Page", page);
    res.set("X-Total-Pages", Math.ceil(total / limit));

    return success(
      res,
      STATUS_CODES.OK,
      transactions,
      "Transactions fetched successfully"
    );
  } catch (err) {
    logger.error(`Error in getTransactions: ${err.message}`);
    return error(res, STATUS_CODES.INTERNAL_SERVER, err.message);
  }
};

/**
 * POST /api/wallet/topup
 * Add funds to wallet
 */
export const topUpWallet = async (req, res) => {
  const logger = getLoggerWithLabel("topUpWallet");
  logger.info("topUpWallet called");

  try {
    const user = await User.findById(req.userId);
    if (!user || !user.companyId) {
      return error(res, STATUS_CODES.BAD_REQUEST, "User or company not found");
    }

    const { amount, referenceId, description } = req.body;

    if (!amount || amount <= 0) {
      return error(res, STATUS_CODES.BAD_REQUEST, "Valid amount is required");
    }

    let wallet = await Wallet.findOne({ companyId: user.companyId });
    if (!wallet) {
      wallet = await Wallet.create({
        companyId: user.companyId,
        balance: 0,
        currency: "USD",
      });
    }

    wallet.balance += amount;
    await wallet.save();

    await WalletTransaction.create({
      walletId: wallet._id,
      companyId: user.companyId,
      type: "credit",
      amount,
      referenceId: referenceId || null,
      description: description || "Wallet top-up",
    });

    logger.info(
      `Wallet topped up: ${amount} for company: ${user.companyId}`
    );

    return success(
      res,
      STATUS_CODES.OK,
      { balance: wallet.balance, currency: wallet.currency },
      "Wallet topped up successfully"
    );
  } catch (err) {
    logger.error(`Error in topUpWallet: ${err.message}`);
    return error(res, STATUS_CODES.INTERNAL_SERVER, err.message);
  }
};

/**
 * POST /api/wallet/deduct
 * Internal - deduct from wallet (e.g., on shipment creation)
 */
export const deductWallet = async (req, res) => {
  const logger = getLoggerWithLabel("deductWallet");
  logger.info("deductWallet called");

  try {
    const user = await User.findById(req.userId);
    if (!user || !user.companyId) {
      return error(res, STATUS_CODES.BAD_REQUEST, "User or company not found");
    }

    const { amount, referenceId, description } = req.body;

    if (!amount || amount <= 0) {
      return error(res, STATUS_CODES.BAD_REQUEST, "Valid amount is required");
    }

    const wallet = await Wallet.findOne({ companyId: user.companyId });
    if (!wallet) {
      return error(res, STATUS_CODES.BAD_REQUEST, "Wallet not found");
    }

    if (wallet.balance < amount) {
      return error(res, STATUS_CODES.BAD_REQUEST, "Insufficient balance");
    }

    wallet.balance -= amount;
    await wallet.save();

    await WalletTransaction.create({
      walletId: wallet._id,
      companyId: user.companyId,
      type: "debit",
      amount,
      referenceId: referenceId || null,
      description: description || "Wallet deduction",
    });

    logger.info(
      `Wallet deducted: ${amount} for company: ${user.companyId}`
    );

    return success(
      res,
      STATUS_CODES.OK,
      { balance: wallet.balance, currency: wallet.currency },
      "Amount deducted successfully"
    );
  } catch (err) {
    logger.error(`Error in deductWallet: ${err.message}`);
    return error(res, STATUS_CODES.INTERNAL_SERVER, err.message);
  }
};
