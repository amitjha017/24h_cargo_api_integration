import mongoose from "mongoose";
const { Schema } = mongoose;

const stateSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    countryId: {
      type: Schema.Types.ObjectId,
      ref: "Country",
      required: true
    },
    countryIso2: {
      type: String
    },
    stateCode: {
      type: String
    },
    adminCode: {
      type: String
    },
    stateInitial: {
      type: String
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

stateSchema.index({ countryId: 1, adminCode: 1 }, { unique: true, sparse: true });

export default mongoose.model("State", stateSchema);
