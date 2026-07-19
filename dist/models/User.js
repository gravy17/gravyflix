"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    _id: { type: mongoose_1.Schema.Types.ObjectId, auto: true },
    fullname: { type: String, required: true },
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    image: { type: String, required: false },
    city: { type: String, required: false },
    country_code: { type: String, minLength: 2, maxLength: 2, required: true },
    active: { type: Boolean, default: true },
    rating: { type: Number, required: false, min: 1, max: 100 },
}, { timestamps: true });
UserSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
    }
});
UserSchema.set("toObject", {
    virtuals: true,
    versionKey: false,
    transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
    }
});
exports.default = (0, mongoose_1.model)('User', UserSchema);
