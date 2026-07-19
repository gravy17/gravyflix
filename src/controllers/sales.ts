import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import { randomUUID } from "crypto";
import Sale from "../models/Sale";
import Movie from "../models/Movie";
import { shapeUser, shapeMovie, withId } from "../utils/shared";
import { recomputeUserRating } from "./user";
import { initiatePayment, verifyPayment } from "../utils/payment";
import User from "../models/User";

const title = process.env.APP_NAME;
const secret = process.env.JWT_SECRET as string;

const send404 = (req: Request, res: Response) => {
  return res.status(404).render("404", {
    status: 404,
    message:
      "The page you're looking for was not found. Try checking your url for spelling mistakes",
    title: title + " | 404",
    user: req.cookies.username,
  });
};

const send500 = (req: Request, res: Response, err: any) => {
  console.error(err);
  return res.status(500).render("500", {
    status: 500,
    message:
      "The server encountered a problem while processing your request. We'll have this fixed soon",
    title: title + " | 500",
    user: req.cookies.username,
  });
};

const POPULATE_USER = "username fullname city country_code rating";

function shapeSale(sale: any) {
  const obj = withId(sale);
  return {
    id: obj.id,
    movie: shapeMovie(obj.movie),
    seller: shapeUser(obj.seller_id),
    buyer: shapeUser(obj.buyer_id),
    valueAmount: obj.value_amount,
    transactionId: obj.transaction_id,
    completed: obj.completed,
    sellerRating: obj.seller_rating,
    createdAt: obj.createdAt,
  };
}

/* ---------- Page render: GET /sales/:id (purchase receipt) ---------- */
export async function renderSale(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const { token, username } = req.cookies;
    if (!token) return res.status(401).redirect("/login");

    const verified = verify(token, secret) as { id: string };
    const sale = await Sale.findById(id)
      .populate("movie")
      .populate("seller_id", POPULATE_USER);

    if (!sale) return send404(req, res);
    const isParticipant =
      sale.buyer_id.toString() === verified.id ||
      sale.seller_id.toString() === verified.id;
    if (!isParticipant) return send404(req, res);

    return res.status(200).render("sale", {
      title: title + " | Purchase receipt",
      user: username,
      sale: shapeSale(sale),
    });
  } catch (error) {
    return send500(req, res, error);
  }
}

/* ---------- API: GET /api/sales?status=completed ---------- */
export async function listSales(req: Request, res: Response) {
  try {
    const userId = req.user;
    const status = (req.query.status as string) || "completed";

    const filter: any = { buyer_id: userId };
    if (status === "completed") filter.completed = true;

    const sales = await Sale.find(filter)
      .sort({ createdAt: -1 })
      .populate("movie")
      .populate("seller_id", POPULATE_USER);

    return res.status(200).json({ sales: sales.map(shapeSale) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not load purchases" });
  }
}

/* ---------- API: POST /api/movies/:id/buy  (MockPay simulated checkout) -
   :id is the listing being bought. Mount alongside your other
   /api/movies/:id/* routes, or move under /api/sales if preferred.
------------------------------------------------------------------------- */
export async function buyMovie(req: Request, res: Response) {
  try {
    const { id: movieId } = req.params;
    const buyerId = req.user;
    const buyer = await User.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({ message: "Buyer not found" });
    }

    const movie = await Movie.findById(movieId);
    if (!movie || movie.active === false) {
      return res.status(404).json({ message: "This listing is no longer available" });
    }
    if (movie.listingType !== "Sale" && movie.listingType !== "Both") {
      return res.status(400).json({ message: "This listing is not for sale" });
    }
    if (movie.createdBy.toString() === buyerId) {
      return res.status(400).json({ message: "You can't buy your own listing" });
    }

    const sale = await Sale.create({
      movie: movie._id,
      seller_id: movie.createdBy,
      buyer_id: buyerId,
      value_amount: movie.price,
      transaction_id: randomUUID(),
      completed: false,
    });

    const authorizationUrl = await initiatePayment(buyer.email, movie.price, `${process.env.APP_URL}/sales/${sale.transaction_id}/complete`);

    return res.status(201).json({ sale: shapeSale(sale), authorizationUrl });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not initiate purchase" });
  }
}

export async function completePurchase(req: Request, res: Response) {
  try {
    const { id: transactionId } = req.params;
    const { reference } = req.query as { reference: string };
    const isVerified = await verifyPayment(reference);

    const sale = await Sale.findOne({ transaction_id: transactionId }).populate("movie").populate("seller_id", POPULATE_USER);
    if (!sale) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    const movie = await Movie.findById(sale.movie);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found. Refund will be processed" });
    }

    if (movie.listingType !== "Sale" && movie.listingType !== "Both") {
      return res.status(400).json({ message: "This listing is no longer for sale. Refund will be processed" });
    }

    if (isVerified) {
      sale.external_reference = reference;
      sale.completed = isVerified;
      await sale.save();

      movie.active = false;
      movie.soldTo = sale.buyer_id as any;
      await movie.save();
    }

    return res.status(200).json({ sale: shapeSale(sale) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not complete purchase" });
  }
}

/* ---------- API: POST /api/sales/:id/rate  (body: { rating }) -----------
   Not wired up on the frontend yet (dashboard's "Purchases completed"
   section only shows the movie card) -- included since Sale.seller_rating
   exists in the schema, but add a rating UI to that section if you want
   buyers to actually use this.
------------------------------------------------------------------------- */
export async function rateSale(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const buyerId = req.user;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const sale = await Sale.findById(id);
    if (!sale) return res.status(404).json({ message: "Sale not found" });
    if (sale.buyer_id.toString() !== buyerId) {
      return res.status(403).json({ message: "Only the buyer can rate this sale" });
    }

    sale.seller_rating = rating;
    await sale.save();
    await recomputeUserRating(sale.seller_id);

    return res.status(200).json({ sale: shapeSale(sale) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not submit rating" });
  }
}
