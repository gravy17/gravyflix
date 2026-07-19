"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const enum_1 = require("../enum");
const MovieSchema = new mongoose_1.Schema({
    _id: { type: mongoose_1.Schema.Types.ObjectId, auto: true },
    title: { type: String, required: true, unique: false, index: true },
    description: { type: String, required: false },
    price: { type: Number, required: true },
    image: { type: String, required: false },
    format: { type: String, required: false, enum: enum_1.FormatEnum },
    condition: { type: String, required: false, enum: enum_1.ConditionEnum },
    listingType: { type: String, enum: enum_1.ListingTypeEnum, required: true },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    active: { type: Boolean, default: true },
    soldTo: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: false },
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
exports.default = (0, mongoose_1.model)('Movie', MovieSchema);
