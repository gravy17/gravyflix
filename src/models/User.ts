import { DataTypes, Model } from "sequelize";
import db from "../config/database.config";
import { Movies } from "./Movie";

interface UserAttributes {
  id: string;
  fullname: string;
  username: string;
  email: string;
  password: string;
}

export class Users extends Model<UserAttributes> {
  movies?: Array<Movies>;
}

Users.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
      unique: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fullname: {
      type: DataTypes.STRING,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    tableName: "users",
  }
);

Users.hasMany(Movies, { foreignKey: "createdBy", as: "movies" });

Movies.belongsTo(Users, { foreignKey: "createdBy", as: "creator" });
