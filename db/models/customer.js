import mongoose from "mongoose";
const Schema = mongoose.Schema;

const customerSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    agencyId: { type: Schema.Types.ObjectId, ref: "Agency" },
    agentId: { type: Schema.Types.ObjectId, ref: "Agent" },
    customerType: { type: String, enum: ["Person", "Company"] },
    email: { type: String },
    phone: { type: String },
    customerCode: { type: String },
    status: { type: String },
    pinZip: { type: String },
    isLockerEnabled: { type: Boolean },
  },
  { timestamps: true }
);

export default mongoose.model("Customer", customerSchema);
