import mongoose from "mongoose";
const Schema = mongoose.Schema;

const roleSchema = new Schema(
  {
    name: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Role", roleSchema);
