import mongoose from "mongoose";
const Schema = mongoose.Schema;

const addressSchema = new Schema(
  {
    address: { type: String },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    countryId: { type: Schema.Types.ObjectId, ref: "Country" },
    stateId: { type: Schema.Types.ObjectId, ref: "State" },
    cityId: { type: Schema.Types.ObjectId, ref: "City" },
    addressType: { type: String, enum: ["primary", "locker"] },
    status: { type: String, enum: ["active", "inactive"] },
    default: { type: Boolean },
  },
  { timestamps: true }
);

export default mongoose.model("address", addressSchema);
