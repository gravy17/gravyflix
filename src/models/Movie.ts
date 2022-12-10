import { DataTypes, Model } from "sequelize";
import db from "../config/database.config";
interface MovieAttributes {
  title: string;
  description: string;
  price: number;
  image: string;
  id: string;
  createdBy: string;
}

export class Movies extends Model<MovieAttributes> {}

Movies.init(
  {
    id: {
      type: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
    },
    image: {
      type: DataTypes.STRING,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.UUIDV4,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    tableName: "movies",
  }
);
