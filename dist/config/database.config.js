"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const DB_USERNAME = process.env.DB_USERNAME || "";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_URL = "./database.sqlite";
const db = new sequelize_1.Sequelize("app", DB_USERNAME, DB_PASSWORD, {
    storage: DB_URL,
    dialect: "sqlite",
    logging: false,
});
exports.default = db;
