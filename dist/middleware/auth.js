"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const User_1 = require("../models/User");
const secret = process.env.JWT_SECRET;
async function auth(req, res, next) {
    try {
        const authorization = req.headers.authorization;
        if (!authorization && !req.cookies.token) {
            return res.status(401).json({ message: "Authentication required. Please login" });
        }
        const token = authorization?.slice(7, authorization.length) || req.cookies.token;
        let verified = (0, jsonwebtoken_1.verify)(token, secret);
        if (!verified) {
            return res.status(401).json({ message: "Token expired/invalid. Please login" });
        }
        const { id } = verified;
        const user = await User_1.Users.findOne({ where: { id }, attributes: ['id', 'username', 'fullname'] });
        if (!user) {
            return res.status(401).json({ message: "User could not be identified" });
        }
        req.user = id;
        next();
    }
    catch (err) {
        res.status(401).json({ message: "User not logged in" });
    }
}
exports.auth = auth;
