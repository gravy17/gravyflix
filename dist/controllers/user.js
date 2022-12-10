"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.login = void 0;
const User_1 = __importDefault(require("../models/User"));
const utils_1 = require("../utils/utils");
const bcryptjs_1 = require("bcryptjs");
async function login(req, res, next) {
    try {
        const validationResult = utils_1.loginValidator.validate(req.body, utils_1.validationOpts);
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
            const token = (0, utils_1.generateToken)({ id });
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
    catch (err) {
        res.status(500).json({
            message: "Unexpected error: Failed to authenticate user",
        });
    }
}
exports.login = login;
async function register(req, res, next) {
    try {
        const validationResult = utils_1.registerValidator.validate(req.body, utils_1.validationOpts);
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
        const newuser = new User_1.default({
            ...req.body,
            password: hashed
        });
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
    catch (err) {
        res.status(500).json({
            message: "Failed to register user",
        });
    }
}
exports.register = register;
