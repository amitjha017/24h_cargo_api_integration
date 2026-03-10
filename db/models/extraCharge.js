import mongoose from "mongoose";
const Schema = mongoose.Schema;

const extraChargeSchema = new Schema(
  {
    rateId: { type: Schema.Types.ObjectId, ref: "Rate" },
    rateChargesName: { type: String },
    rateChargesType: { type: String },
    rateChargesValue: { type: Number },
    description: { type: String },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    default: { type: Boolean },
  },
  { timestamps: true }
);

export default mongoose.model("extracharge", extraChargeSchema);
