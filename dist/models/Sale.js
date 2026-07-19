"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const SaleSchema = new mongoose_1.Schema({
    _id: { type: mongoose_1.Schema.Types.ObjectId, auto: true },
    movie: { type: mongoose_1.Schema.Types.ObjectId, ref: "Movie", required: true },
    seller_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    buyer_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    value_amount: { type: Number, required: true },
    transaction_id: { type: String, required: true, unique: true },
    external_reference: { type: String, required: false },
    completed: { type: Boolean, default: false },
    seller_rating: { type: Number, required: false, min: 1, max: 5 },
}, { timestamps: true });
SaleSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
    }
});
SaleSchema.set("toObject", {
    virtuals: true,
    versionKey: false,
    transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
    }
});
exports.default = (0, mongoose_1.model)('Sale', SaleSchema);
