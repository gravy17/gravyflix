import { Schema, model } from "mongoose";

const TradeSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    seller_movie: { type: Schema.Types.ObjectId, ref: "Movie", required: true },
    buyer_movie: { type: Schema.Types.ObjectId, ref: "Movie", required: false },
    seller_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    buyer_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    seller_rating: { type: Number, required: false, min: 1, max: 5 },
    buyer_rating: { type: Number, required: false, min: 1, max: 5 },
    seller_confirmed: { type: Boolean, default: false },
    buyer_confirmed: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

TradeSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});

TradeSchema.set("toObject", {
  virtuals: true,
  versionKey: false,
  transform(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});

export default model('Trade', TradeSchema);