import { Schema, model } from "mongoose";
import { FormatEnum, ConditionEnum, ListingTypeEnum } from "../enum";


const MovieSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, auto: true },
  title: { type: String, required: true, unique: false, index: true },
  description: { type: String, required: false },
  price: { type: Number, required: true },
  image: { type: String, required: false },
  format: { type: String, required: false, enum: FormatEnum },
  condition: { type: String, required: false, enum: ConditionEnum },
  listingType: { type: String, enum:  ListingTypeEnum, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  active: { type: Boolean, default: true },
  soldTo: { type: Schema.Types.ObjectId, ref: "User", required: false },
}, { timestamps: true });

MovieSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});

MovieSchema.set("toObject", {
  virtuals: true,
  versionKey: false,
  transform(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});

export default model('Movie', MovieSchema);
