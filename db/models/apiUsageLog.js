import mongoose from "mongoose";
const Schema = mongoose.Schema;

const apiUsageLogSchema = new Schema({
  appId: {
    type: Schema.Types.ObjectId,
    ref: "ApiApp",
    required: true,
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  endpoint: {
    type: String,
    required: true,
  },
  method: {
    type: String,
    required: true,
  },
  statusCode: {
    type: Number,
  },
  latencyMs: {
    type: Number,
  },
  ipAddress: {
    type: String,
  },
  location: {
    country: { type: String },
    city: { type: String },
    region: { type: String },
  },
  calledAt: {
    type: Date,
    default: Date.now,
  },
});

apiUsageLogSchema.index({ appId: 1, calledAt: -1 });
apiUsageLogSchema.index({ companyId: 1, calledAt: -1 });

const ApiUsageLog = mongoose.model("ApiUsageLog", apiUsageLogSchema);
export default ApiUsageLog;
