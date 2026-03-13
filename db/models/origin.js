import mongoose from "mongoose";
const Schema = mongoose.Schema;

const originSchema = new Schema(
  {
    name: { type: String },
    fullAddress: { type: String },
    phone: { type: String },
    email: { type: String },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    cityId: { type: Schema.Types.ObjectId, ref: "City" },
    stateId: { type: Schema.Types.ObjectId, ref: "State" },
    countryId: { type: Schema.Types.ObjectId, ref: "Country" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Origin", originSchema);
