import mongoose from "mongoose";
const Schema = mongoose.Schema;

const apiAppSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    appName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    appFor: {
      type: String,
      enum: ["website", "app", "other"],
      required: true,
    },
    otherIntegration: {
      type: String,
    },
    clientId: {
      type: String,
      unique: true,
      required: true,
    },
    secretKeyHash: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const ApiApp = mongoose.model("ApiApp", apiAppSchema);
export default ApiApp;
