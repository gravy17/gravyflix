"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.login = exports.getUserMovies = void 0;
const uuid_1 = require("uuid");
const User_1 = require("../models/User");
const utils_1 = require("../utils/utils");
const bcryptjs_1 = require("bcryptjs");
const Movie_1 = require("../models/Movie");
async function getUserMovies(req, res, next) {
    try {
        const { user } = req;
        const limit = req.query?.limit;
        const offset = req.query?.offset;
        const record = await User_1.Users.findOne({
            where: { id: user },
            include: [
                {
                    model: Movie_1.Movies,
                    as: "movies",
                },
            ],
            attributes: ["id", "username", "fullname", "email"],
        });
        res.status(200).json({
            message: "User Data found",
            record,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Unexpected error: Failed to get movies",
        });
    }
}
exports.getUserMovies = getUserMovies;
async function login(req, res, next) {
    try {
        const validationResult = utils_1.loginValidator.validate(req.body, utils_1.validationOpts);
        if (validationResult.error) {
            return res.status(400).json({
                message: validationResult.error.details[0].message,
            });
        }
        const { username, password } = req.body;
        const user = await User_1.Users.findOne({
            where: { username },
            include: [
                {
                    model: Movie_1.Movies,
                    as: "movies",
                },
            ],
        });
        if (!user) {
            return res.status(401).json({
                message: "Invalid Credentials",
            });
        }
        const hash = user.getDataValue("password");
        const valid = await (0, bcryptjs_1.compare)(password, hash);
        if (!!valid) {
            const id = user.getDataValue("id");
            const token = (0, utils_1.generateToken)({ id });
            return res
                .status(200)
                .cookie("token", token, {
                maxAge: 7 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                sameSite: "strict",
            })
                .cookie("username", user.getDataValue("username"), {
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
    const id = (0, uuid_1.v4)();
    try {
        const validationResult = utils_1.registerValidator.validate(req.body, utils_1.validationOpts);
        if (validationResult.error) {
            return res.status(400).json({
                Error: validationResult.error.details[0].message,
            });
        }
        const duplicateEmail = await User_1.Users.findOne({
            where: { email: req.body.email },
        });
        if (!!duplicateEmail) {
            return res.status(400).json({
                message: "Email already exists",
            });
        }
        const hashed = await (0, bcryptjs_1.hash)(req.body.password, 8);
        const record = await User_1.Users.create({ ...req.body, id, password: hashed });
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
