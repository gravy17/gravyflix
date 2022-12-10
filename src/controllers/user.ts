import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { Users } from "../models/User";
import {
  registerValidator,
  loginValidator,
  validationOpts,
  generateToken,
} from "../utils/utils";
import { hash, compare } from "bcryptjs";
import { Movies } from "../models/Movie";

export async function getUserMovies(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { user } = req;
    const limit = req.query?.limit as number | undefined;
    const offset = req.query?.offset as number | undefined;
    const record = await Users.findOne({
      where: { id: user },
      include: [
        {
          model: Movies,
          as: "movies",
        },
      ],
      attributes: ["id", "username", "fullname", "email"],
    });
    res.status(200).json({
      message: "User Data found",
      record,
    });
  } catch (error) {
    res.status(500).json({
      message: "Unexpected error: Failed to get movies",
    });
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const validationResult = loginValidator.validate(req.body, validationOpts);
    if (validationResult.error) {
      return res.status(400).json({
        message: validationResult.error.details[0].message,
      });
    }

    const { username, password } = req.body;
    const user = await Users.findOne({
      where: { username },
      include: [
        {
          model: Movies,
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
    const valid = await compare(password, hash);
    if (!!valid) {
      const id = user.getDataValue("id");
      const token = generateToken({ id });
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
    } else {
      return res.status(401).json({
        message: "Invalid Credentials",
      });
    }
  } catch (err) {
    res.status(500).json({
      message: "Unexpected error: Failed to authenticate user",
    });
  }
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const id = uuidv4();
  try {
    const validationResult = registerValidator.validate(
      req.body,
      validationOpts
    );
    if (validationResult.error) {
      return res.status(400).json({
        Error: validationResult.error.details[0].message,
      });
    }

    const duplicateEmail = await Users.findOne({
      where: { email: req.body.email },
    });
    if (!!duplicateEmail) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const hashed = await hash(req.body.password, 8);
    const record = await Users.create({ ...req.body, id, password: hashed });
    if (!!record) {
      return res.status(201).json({
        message: "User successfully registered",
      });
    } else {
      throw new Error();
    }
  } catch (err) {
    res.status(500).json({
      message: "Failed to register user",
    });
  }
}
