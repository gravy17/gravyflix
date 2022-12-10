import { Schema, model } from "mongoose";

const UserSchema = new Schema({
  fullname: { type: String, required: true },
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
}, { timestamps: true });

export default model('User', UserSchema);