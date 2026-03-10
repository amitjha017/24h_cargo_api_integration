import mongoose from "mongoose";
const { Schema } = mongoose;

const citySchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    stateId: {
      type: Schema.Types.ObjectId,
      ref: "State"
    },
    countryId: {
      type: Schema.Types.ObjectId,
      ref: "Country",
      required: true
    },
    cityCode: {
      type: String
    },
    status: {
      type: String,
      default: "active"
    },
    countryIso2: {
      type: String
    },
    admin1Code: {
      type: String
    },
    latitude: {
      type: String
    },
    longitude: {
      type: String
    },
    population: {
      type: Number
    },
    geonameId: {
      type: Number,
      unique: true,
      sparse: true
    },
    source: {
      type: String,
      default: "manual"
    }
  },
  { timestamps: true }
);

citySchema.index({ countryId: 1, stateId: 1 });
citySchema.index({ name: 1, countryId: 1 });

export default mongoose.model("City", citySchema);
