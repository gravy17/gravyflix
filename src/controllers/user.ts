import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import Trade from "../models/Trade";
import Sale from "../models/Sale";
import {
  registerValidator,
  loginValidator,
  validationOpts,
  generateToken,
} from "../utils/validation";
import { uploadImage } from "../utils/image-utils";
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
    const { image, ...rest } = req.body;

    const payload = {
      ...rest,
      password: hashed,
    } as Record<string, unknown>;

    if (image) {
      const fileName = `${req.body.username}-${Date.now()}.jpg`;
      const uploadedImageUrl = await uploadImage(image, fileName, req.body.username);
      payload.image = uploadedImageUrl || image;
    }

    const newuser = new User(payload);
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

/*
  Rolls a user's individual 1-5 trade/sale ratings up into User.rating,
  which is stored on a 1-100 scale (per the schema's min/max). Called
  synchronously right after a rating is submitted (see trades.ts/sales.ts)
  so the number stays current -- if you'd rather match "calculated and
  updated periodically" literally, pull the body of this function out into
  a scheduled job instead and drop the call sites.
*/
export async function recomputeUserRating(userId: any) {
  try {
    const [tradesAsSeller, tradesAsBuyer, sales] = await Promise.all([
      Trade.find({ seller_id: userId, seller_rating: { $exists: true } }, "seller_rating"),
      Trade.find({ buyer_id: userId, buyer_rating: { $exists: true } }, "buyer_rating"),
      Sale.find({ seller_id: userId, seller_rating: { $exists: true } }, "seller_rating"),
    ]);

    const ratings = [
      ...tradesAsSeller.map((t) => t.seller_rating),
      ...tradesAsBuyer.map((t) => t.buyer_rating),
      ...sales.map((s) => s.seller_rating),
    ].filter((r): r is number => typeof r === "number");

    if (!ratings.length) return;

    // Individual ratings are 1-5; User.rating is 1-100, so scale up.
    const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    const scaled = Math.round((average / 5) * 100);

    await User.findByIdAndUpdate(userId, { rating: scaled });
  } catch (error) {
    console.error(error);
  }
}

/* ---------- API: GET /api/stats/marketplace ---------- */
// "verifiedSellers" uses User.active as a stand-in -- the schema doesn't
// have a dedicated verification flag, so this currently just counts
// non-deactivated accounts. Swap the filter if/when a real verified flag
// gets added.
export async function getMarketplaceStats(req: Request, res: Response) {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [verifiedSellers, tradesThisMonth, salesThisMonth] = await Promise.all([
      User.countDocuments({ active: true }),
      Trade.countDocuments({ completed: true, updatedAt: { $gte: startOfMonth } }),
      Sale.countDocuments({ completed: true, updatedAt: { $gte: startOfMonth } }),
    ]);

    return res.status(200).json({
      verifiedSellers,
      tradedThisMonth: tradesThisMonth + salesThisMonth,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not load marketplace stats" });
  }
}
