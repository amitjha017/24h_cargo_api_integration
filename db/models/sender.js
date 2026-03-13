import mongoose from "mongoose";
const Schema = mongoose.Schema;

const senderSchema = new Schema(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "Customer" },
    recieptents: [
      {
        firstName: { type: String, required: true },
        lastName: { type: String },
        email: { type: String, unique: true },
        phone: { type: String },
        address: { type: String },
        countryId: { type: Schema.Types.ObjectId, ref: "Country" },
        stateId: { type: Schema.Types.ObjectId, ref: "State" },
        cityId: { type: Schema.Types.ObjectId, ref: "City" },
        postalCode: { type: String },
        addedAt: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Sender", senderSchema);
