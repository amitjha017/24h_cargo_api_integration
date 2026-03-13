import mongoose from "mongoose";
const Schema = mongoose.Schema;

const sequenceSchema = new Schema(
  {
    name: { type: String },
    sequenceValue: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Sequence", sequenceSchema);
