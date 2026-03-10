import mongoose from "mongoose";
const Schema = mongoose.Schema;

const serviceTypeSchema = new Schema(
  {
    name: { type: String },
    description: { type: String },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
  },
  { timestamps: true }
);

export default mongoose.model("ServiceType", serviceTypeSchema);
