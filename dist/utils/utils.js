"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.validationOpts = exports.loginValidator = exports.registerValidator = exports.movieModValidator = exports.movieValidator = void 0;
const joi_1 = __importDefault(require("joi"));
const jsonwebtoken_1 = require("jsonwebtoken");
exports.movieValidator = joi_1.default.object().keys({
    title: joi_1.default.string().lowercase().required(),
    description: joi_1.default.string(),
    image: joi_1.default.string().uri().allow('').default('/images/default-movie.jpg'),
    price: joi_1.default.number().required(),
});
exports.movieModValidator = joi_1.default.object().keys({
    title: joi_1.default.string().lowercase(),
    description: joi_1.default.string(),
    image: joi_1.default.string().uri().allow("").default("/images/default-movie.jpg"),
    price: joi_1.default.number(),
});
exports.registerValidator = joi_1.default.object()
    .keys({
    fullname: joi_1.default.string(),
    username: joi_1.default.string().required(),
    email: joi_1.default.string().trim().lowercase().required(),
    password: joi_1.default.string()
        .min(8)
        .max(30)
        .required(),
    confirm_password: joi_1.default.ref("password")
})
    .with("password", "confirm_password");
exports.loginValidator = joi_1.default.object().keys({
    username: joi_1.default.string().required(),
    password: joi_1.default.string()
        .min(8)
        .max(30)
        .required()
});
exports.validationOpts = {
    abortEarly: false,
    errors: {
        wrap: {
            label: "",
        },
    },
};
const generateToken = (user) => {
    try {
        const secret = process.env.JWT_SECRET;
        return (0, jsonwebtoken_1.sign)(user, secret, { expiresIn: "7d" });
    }
    catch (err) {
        console.error(err);
    }
};
exports.generateToken = generateToken;
