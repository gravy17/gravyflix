"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMarketplaceStats = exports.recomputeUserRating = exports.register = exports.login = void 0;
const User_1 = __importDefault(require("../models/User"));
const Trade_1 = __importDefault(require("../models/Trade"));
const Sale_1 = __importDefault(require("../models/Sale"));
const validation_1 = require("../utils/validation");
const image_utils_1 = require("../utils/image-utils");
const bcryptjs_1 = require("bcryptjs");
async function login(req, res, next) {
    try {
        const validationResult = validation_1.loginValidator.validate(req.body, validation_1.validationOpts);
        if (validationResult.error) {
            return res.status(400).json({
                message: validationResult.error.details[0].message,
            });
        }
        const { username, password } = req.body;
        const user = await User_1.default.findOne({ username: username });
        if (!user) {
            return res.status(401).json({
                message: "Invalid Credentials",
            });
        }
        const hash = user.password;
        const valid = await (0, bcryptjs_1.compare)(password, hash);
        if (!!valid) {
            const id = user._id.toString();
            const token = (0, validation_1.generateToken)({ id });
            return res
                .status(200)
                .cookie("token", token, {
                maxAge: 7 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                sameSite: "strict",
            })
                .cookie("username", user.username, {
                maxAge: 7 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                sameSite: "strict",
            })
                .json({
                message: "User successfully authenticated",
            });
        }
        else {
            return res.status(401).json({
                message: "Invalid Credentials",
            });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unexpected error: Failed to authenticate user",
        });
    }
}
exports.login = login;
async function register(req, res, next) {
    try {
        const validationResult = validation_1.registerValidator.validate(req.body, validation_1.validationOpts);
        if (validationResult.error) {
            return res.status(400).json({
                Error: validationResult.error.details[0].message,
            });
        }
        const duplicateEmail = await User_1.default.findOne({ email: req.body.email });
        if (!!duplicateEmail) {
            return res.status(400).json({
                message: "Email already exists",
            });
        }
        const hashed = await (0, bcryptjs_1.hash)(req.body.password, 8);
        const { image, ...rest } = req.body;
        const payload = {
            ...rest,
            password: hashed,
        };
        if (image) {
            const fileName = `${req.body.username}-${Date.now()}.jpg`;
            const uploadedImageUrl = await (0, image_utils_1.uploadImage)(image, fileName, req.body.username);
            payload.image = uploadedImageUrl || image;
        }
        const newuser = new User_1.default(payload);
        const record = await newuser.save();
        if (!!record) {
            return res.status(201).json({
                message: "User successfully registered",
            });
        }
        else {
            throw new Error();
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to register user",
        });
    }
}
exports.register = register;
/*
  Rolls a user's individual 1-5 trade/sale ratings up into User.rating,
  which is stored on a 1-100 scale (per the schema's min/max). Called
  synchronously right after a rating is submitted (see trades.ts/sales.ts)
  so the number stays current -- if you'd rather match "calculated and
  updated periodically" literally, pull the body of this function out into
  a scheduled job instead and drop the call sites.
*/
async function recomputeUserRating(userId) {
    try {
        const [tradesAsSeller, tradesAsBuyer, sales] = await Promise.all([
            Trade_1.default.find({ seller_id: userId, seller_rating: { $exists: true } }, "seller_rating"),
            Trade_1.default.find({ buyer_id: userId, buyer_rating: { $exists: true } }, "buyer_rating"),
            Sale_1.default.find({ seller_id: userId, seller_rating: { $exists: true } }, "seller_rating"),
        ]);
        const ratings = [
            ...tradesAsSeller.map((t) => t.seller_rating),
            ...tradesAsBuyer.map((t) => t.buyer_rating),
            ...sales.map((s) => s.seller_rating),
        ].filter((r) => typeof r === "number");
        if (!ratings.length)
            return;
        // Individual ratings are 1-5; User.rating is 1-100, so scale up.
        const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        const scaled = Math.round((average / 5) * 100);
        await User_1.default.findByIdAndUpdate(userId, { rating: scaled });
    }
    catch (error) {
        console.error(error);
    }
}
exports.recomputeUserRating = recomputeUserRating;
/* ---------- API: GET /api/stats/marketplace ---------- */
// "verifiedSellers" uses User.active as a stand-in -- the schema doesn't
// have a dedicated verification flag, so this currently just counts
// non-deactivated accounts. Swap the filter if/when a real verified flag
// gets added.
async function getMarketplaceStats(req, res) {
    try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const [verifiedSellers, tradesThisMonth, salesThisMonth] = await Promise.all([
            User_1.default.countDocuments({ active: true }),
            Trade_1.default.countDocuments({ completed: true, updatedAt: { $gte: startOfMonth } }),
            Sale_1.default.countDocuments({ completed: true, updatedAt: { $gte: startOfMonth } }),
        ]);
        return res.status(200).json({
            verifiedSellers,
            tradedThisMonth: tradesThisMonth + salesThisMonth,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Could not load marketplace stats" });
    }
}
exports.getMarketplaceStats = getMarketplaceStats;
