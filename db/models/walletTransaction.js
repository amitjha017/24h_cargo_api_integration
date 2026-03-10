import mongoose from "mongoose";
const Schema = mongoose.Schema;

const walletTransactionSchema = new Schema({
  walletId: {
    type: Schema.Types.ObjectId,
    ref: "Wallet",
    required: true,
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  type: {
    type: String,
    enum: ["credit", "debit"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  referenceId: {
    type: String,
  },
  description: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

walletTransactionSchema.index({ walletId: 1, createdAt: -1 });
walletTransactionSchema.index({ companyId: 1, createdAt: -1 });

const WalletTransaction = mongoose.model(
  "WalletTransaction",
  walletTransactionSchema
);
export default WalletTransaction;
