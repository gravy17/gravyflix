import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import Trade from "../models/Trade";
import Movie from "../models/Movie";
import { shapeUser, shapeMovie, withId } from "../utils/shared";
import { recomputeUserRating } from "./user";

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

function shapeTrade(trade: any) {
  const obj = withId(trade);
  return {
    id: obj.id,
    seller: shapeUser(obj.seller_id),
    buyer: shapeUser(obj.buyer_id),
    seller_movie: shapeMovie(obj.seller_movie),
    buyer_movie: shapeMovie(obj.buyer_movie),
    seller_confirmed: obj.seller_confirmed,
    buyer_confirmed: obj.buyer_confirmed,
    seller_rating: obj.seller_rating,
    buyer_rating: obj.buyer_rating,
    completed: obj.completed,
    createdAt: obj.createdAt,
  };
}

/* ---------- Page render: GET /trades/:id ---------- */
// Follows renderDashboard's pattern of decoding the cookie token directly
// rather than assuming middleware ran -- trade.ejs needs userId either way
// to work out which side of the trade the viewer is on.
export async function renderTrade(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const { token, username } = req.cookies;
    if (!token) {
      return res.status(401).redirect("/login");
    }

    const verified = verify(token, secret) as { id: string };
    const trade = await Trade.findById(id);
    if (!trade) return send404(req, res);

    const isParticipant =
      trade.seller_id.toString() === verified.id ||
      trade.buyer_id.toString() === verified.id;
    if (!isParticipant) return send404(req, res);

    return res.status(200).render("trade", {
      title: title + " | Trade",
      user: username,
      userId: verified.id,
      tradeId: id,
    });
  } catch (error) {
    return send500(req, res, error);
  }
}

/* ---------- API: GET /api/trades?status=in-progress|completed ---------- */
// Requires the `auth` middleware mounted ahead of this route (req.user set).
export async function listTrades(req: Request, res: Response) {
  try {
    const userId = req.user;
    const status = (req.query.status as string) || "in-progress";

    const filter: any = { $or: [{ seller_id: userId }, { buyer_id: userId }] };
    filter.completed = status === "completed";

    const trades = await Trade.find(filter)
      .sort({ updatedAt: -1 })
      .populate("seller_id", POPULATE_USER)
      .populate("buyer_id", POPULATE_USER)
      .populate("seller_movie")
      .populate("buyer_movie");

    return res.status(200).json({ trades: trades.map(shapeTrade) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not load trades" });
  }
}

/* ---------- API: GET /api/trades/:id ---------- */
export async function getTrade(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const trade = await Trade.findById(id)
      .populate("seller_id", POPULATE_USER)
      .populate("buyer_id", POPULATE_USER)
      .populate("seller_movie")
      .populate("buyer_movie");

    if (!trade) return res.status(404).json({ message: "Trade not found" });

    const userId = req.user;
    const isParticipant =
      trade.seller_id._id.toString() === userId ||
      trade.buyer_id._id.toString() === userId;
    if (!isParticipant) {
      return res.status(403).json({ message: "Not authorized to view this trade" });
    }

    return res.status(200).json({ trade: shapeTrade(trade) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not load trade" });
  }
}

/* ---------- API: POST /api/movies/:id/trade  (body: { buyerMovie }) ----
   :id here is the SELLER's listing being requested. Mount this alongside
   your other /api/movies/:id/* routes, or move it to /api/trades if you'd
   rather keep all trade creation under one namespace -- either works with
   this handler as written.
------------------------------------------------------------------------- */
export async function proposeTrade(req: Request, res: Response) {
  try {
    const { id: movieId } = req.params;
    const { buyerMovie } = req.body;
    const buyerId = req.user;

    const sellerMovie = await Movie.findById(movieId);
    if (!sellerMovie || sellerMovie.active === false) {
      return res.status(404).json({ message: "This listing is no longer available" });
    }
    if (sellerMovie.listingType !== "Trade" && sellerMovie.listingType !== "Both") {
      return res.status(400).json({ message: "This listing is not open to trade" });
    }
    if (sellerMovie.createdBy.toString() === buyerId) {
      return res.status(400).json({ message: "You can't propose a trade on your own listing" });
    }

    let buyerMovieDoc = null;
    if (buyerMovie) {
      buyerMovieDoc = await Movie.findOne({
        _id: buyerMovie,
        createdBy: buyerId,
        active: { $ne: false },
      });
      if (!buyerMovieDoc) {
        return res.status(400).json({ message: "Selected movie is not in your active catalog" });
      }
    }

    const trade = await Trade.create({
      seller_movie: sellerMovie._id,
      buyer_movie: buyerMovieDoc ? buyerMovieDoc._id : undefined,
      seller_id: sellerMovie.createdBy,
      buyer_id: buyerId,
    });

    return res.status(201).json({ trade: { id: trade.id } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not create trade proposal" });
  }
}

/* ---------- API: POST /api/trades/:id/confirm ---------- */
export async function confirmTrade(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user;

    const trade = await Trade.findById(id);
    if (!trade) return res.status(404).json({ message: "Trade not found" });

    const isSeller = trade.seller_id.toString() === userId;
    const isBuyer = trade.buyer_id.toString() === userId;
    if (!isSeller && !isBuyer) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (isSeller) trade.seller_confirmed = true;
    if (isBuyer) trade.buyer_confirmed = true;

    if (trade.seller_confirmed && trade.buyer_confirmed) {
      trade.completed = true;
      // Movies change hands -- take both listings off the active market.
      await Movie.findByIdAndUpdate(trade.seller_movie, {
        active: false,
        soldTo: trade.buyer_id,
      });
      if (trade.buyer_movie) {
        await Movie.findByIdAndUpdate(trade.buyer_movie, {
          active: false,
          soldTo: trade.seller_id,
        });
      }
    }

    await trade.save();
    await trade.populate(["seller_id", "buyer_id", "seller_movie", "buyer_movie"]);

    return res.status(200).json({ trade: shapeTrade(trade) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not confirm trade" });
  }
}

/* ---------- API: POST /api/trades/:id/rate  (body: { rating }) ----------
   seller_rating is read as "the rating the seller received" (given by the
   buyer), mirroring Sale.seller_rating -- flag if that's backwards from
   what you intended.
------------------------------------------------------------------------- */
export async function rateTrade(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const userId = req.user;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const trade = await Trade.findById(id);
    if (!trade) return res.status(404).json({ message: "Trade not found" });

    const isSeller = trade.seller_id.toString() === userId;
    const isBuyer = trade.buyer_id.toString() === userId;
    if (!isSeller && !isBuyer) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Buyer rates the seller; seller rates the buyer.
    if (isBuyer) trade.seller_rating = rating;
    if (isSeller) trade.buyer_rating = rating;

    await trade.save();

    const ratedUserId = isBuyer ? trade.seller_id : trade.buyer_id;
    await recomputeUserRating(ratedUserId);

    return res.status(200).json({ trade: shapeTrade(trade) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not submit rating" });
  }
}
