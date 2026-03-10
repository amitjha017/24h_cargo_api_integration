import mongoose from "mongoose";
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    username: { type: String },
    email: { type: String, required: true },
    phone: { type: String },
    mobile: { type: String },
    password: { type: String, trim: true, required: true },
    roleId: { type: Schema.Types.ObjectId, ref: "Role" },
    companyId: { type: mongoose.Types.ObjectId, ref: "Company" },
    status: { type: String, default: "active" },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
