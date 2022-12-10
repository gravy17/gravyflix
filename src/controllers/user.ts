import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import {
  registerValidator,
  loginValidator,
  validationOpts,
  generateToken,
} from "../utils/utils";
import { hash, compare } from "bcryptjs";

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const validationResult = loginValidator.validate(req.body, validationOpts);
    if (validationResult.error) {
      return res.status(400).json({
        message: validationResult.error.details[0].message,
      });
    }

    const { username, password } = req.body;
    const user = await User.findOne({ username: username });

    if (!user) {
      return res.status(401).json({
        message: "Invalid Credentials",
      });
    }

    const hash = user.password;
    const valid = await compare(password, hash);
    if (!!valid) {
      const id = user._id.toString();
      const token = generateToken({ id });
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
    } else {
      return res.status(401).json({
        message: "Invalid Credentials",
      });
    }
  } catch (error) {
    console.error(error)
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

    const duplicateEmail = await User.findOne({ email: req.body.email });
    if (!!duplicateEmail) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const hashed = await hash(req.body.password, 8);
    const newuser = new User({ 
      ...req.body,
      password: hashed 
    });
    const record = await newuser.save();
    if (!!record) {
      return res.status(201).json({
        message: "User successfully registered",
      });
    } else {
      throw new Error();
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: "Failed to register user",
    });
  }
}
