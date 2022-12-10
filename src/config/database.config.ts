import { Sequelize } from "sequelize";

const DB_USERNAME = process.env.DB_USERNAME || "";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_URL = "./database.sqlite";

const db = new Sequelize("app", DB_USERNAME, DB_PASSWORD, {
  storage: DB_URL,
  dialect: "sqlite",
  logging: false,
});

export default db;
