import { Schema, model } from "mongoose";

const MovieSchema = new Schema({
  title: { type: String, required: true, unique: true, index: true },
  description: { type: String, required: false },
  price: { type: Number, required: true },
  image: { type: String, required: false },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default model('Movie', MovieSchema);
