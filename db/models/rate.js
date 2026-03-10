import mongoose from "mongoose";
const Schema = mongoose.Schema;

const rateSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    logo: { type: String },
    transiteDays: { type: String },
    handlingFee: { type: String },
    insurancePercentage: { type: String },
    weightUnit: { type: String },
    weightValue: { type: String },
    serviceTypeId: { type: Schema.Types.ObjectId, ref: "ServiceType" },
    serviceType: { type: String },
    accountPrice: { type: String },
    publicPrice: { type: String },
    origin: { type: String },
    originCode: { type: String },
    destination: { type: String },
    destinationCode: { type: String },
    rateType: { type: String },
    shipmentDeclarationTaxSlab: [
      {
        shipmentTaxFrom: { type: String },
        shipmentTaxTo: { type: String },
        shipmentTaxPercentege: { type: String },
      },
    ],
    isDeleted: { type: Boolean },
  },
  { timestamps: true }
);

export default mongoose.model("Rate", rateSchema);
