"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateSale = exports.completePurchase = exports.buyMovie = exports.listSales = exports.renderSale = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const crypto_1 = require("crypto");
const Sale_1 = __importDefault(require("../models/Sale"));
const Movie_1 = __importDefault(require("../models/Movie"));
const shared_1 = require("../utils/shared");
const user_1 = require("./user");
const payment_1 = require("../utils/payment");
const User_1 = __importDefault(require("../models/User"));
const title = process.env.APP_NAME;
const secret = process.env.JWT_SECRET;
const send404 = (req, res) => {
    return res.status(404).render("404", {
        status: 404,
        message: "The page you're looking for was not found. Try checking your url for spelling mistakes",
        title: title + " | 404",
        user: req.cookies.username,
    });
};
const send500 = (req, res, err) => {
    console.error(err);
    return res.status(500).render("500", {
        status: 500,
        message: "The server encountered a problem while processing your request. We'll have this fixed soon",
        title: title + " | 500",
        user: req.cookies.username,
    });
};
const POPULATE_USER = "username fullname city country_code rating";
function shapeSale(sale) {
    const obj = (0, shared_1.withId)(sale);
    return {
        id: obj.id,
        movie: (0, shared_1.shapeMovie)(obj.movie),
        seller: (0, shared_1.shapeUser)(obj.seller_id),
        buyer: (0, shared_1.shapeUser)(obj.buyer_id),
        valueAmount: obj.value_amount,
        transactionId: obj.transaction_id,
        completed: obj.completed,
        sellerRating: obj.seller_rating,
        createdAt: obj.createdAt,
    };
}
/* ---------- Page render: GET /sales/:id (purchase receipt) ---------- */
async function renderSale(req, res, next) {
    try {
        const { id } = req.params;
        const { token, username } = req.cookies;
        if (!token)
            return res.status(401).redirect("/login");
        const verified = (0, jsonwebtoken_1.verify)(token, secret);
        const sale = await Sale_1.default.findById(id)
            .populate("movie")
            .populate("seller_id", POPULATE_USER);
        if (!sale)
            return send404(req, res);
        const isParticipant = sale.buyer_id.toString() === verified.id ||
            sale.seller_id.toString() === verified.id;
        if (!isParticipant)
            return send404(req, res);
        return res.status(200).render("sale", {
            title: title + " | Purchase receipt",
            user: username,
            sale: shapeSale(sale),
        });
    }
    catch (error) {
        return send500(req, res, error);
    }
}
exports.renderSale = renderSale;
/* ---------- API: GET /api/sales?status=completed ---------- */
async function listSales(req, res) {
    try {
        const userId = req.user;
        const status = req.query.status || "completed";
        const filter = { buyer_id: userId };
        if (status === "completed")
            filter.completed = true;
        const sales = await Sale_1.default.find(filter)
            .sort({ createdAt: -1 })
            .populate("movie")
            .populate("seller_id", POPULATE_USER);
        return res.status(200).json({ sales: sales.map(shapeSale) });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Could not load purchases" });
    }
}
exports.listSales = listSales;
/* ---------- API: POST /api/movies/:id/buy  (MockPay simulated checkout) -
   :id is the listing being bought. Mount alongside your other
   /api/movies/:id/* routes, or move under /api/sales if preferred.
------------------------------------------------------------------------- */
async function buyMovie(req, res) {
    try {
        const { id: movieId } = req.params;
        const buyerId = req.user;
        const buyer = await User_1.default.findById(buyerId);
        if (!buyer) {
            return res.status(404).json({ message: "Buyer not found" });
        }
        const movie = await Movie_1.default.findById(movieId);
        if (!movie || movie.active === false) {
            return res.status(404).json({ message: "This listing is no longer available" });
        }
        if (movie.listingType !== "Sale" && movie.listingType !== "Both") {
            return res.status(400).json({ message: "This listing is not for sale" });
        }
        if (movie.createdBy.toString() === buyerId) {
            return res.status(400).json({ message: "You can't buy your own listing" });
        }
        const sale = await Sale_1.default.create({
            movie: movie._id,
            seller_id: movie.createdBy,
            buyer_id: buyerId,
            value_amount: movie.price,
            transaction_id: (0, crypto_1.randomUUID)(),
            completed: false,
        });
        const authorizationUrl = await (0, payment_1.initiatePayment)(buyer.email, movie.price, `${process.env.APP_URL}/sales/${sale.transaction_id}/complete`);
        return res.status(201).json({ sale: shapeSale(sale), authorizationUrl });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Could not initiate purchase" });
    }
}
exports.buyMovie = buyMovie;
async function completePurchase(req, res) {
    try {
        const { id: transactionId } = req.params;
        const { reference } = req.query;
        const isVerified = await (0, payment_1.verifyPayment)(reference);
        const sale = await Sale_1.default.findOne({ transaction_id: transactionId }).populate("movie").populate("seller_id", POPULATE_USER);
        if (!sale) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        const movie = await Movie_1.default.findById(sale.movie);
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
            movie.soldTo = sale.buyer_id;
            await movie.save();
        }
        return res.status(200).json({ sale: shapeSale(sale) });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Could not complete purchase" });
    }
}
exports.completePurchase = completePurchase;
/* ---------- API: POST /api/sales/:id/rate  (body: { rating }) -----------
   Not wired up on the frontend yet (dashboard's "Purchases completed"
   section only shows the movie card) -- included since Sale.seller_rating
   exists in the schema, but add a rating UI to that section if you want
   buyers to actually use this.
------------------------------------------------------------------------- */
async function rateSale(req, res) {
    try {
        const { id } = req.params;
        const { rating } = req.body;
        const buyerId = req.user;
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }
        const sale = await Sale_1.default.findById(id);
        if (!sale)
            return res.status(404).json({ message: "Sale not found" });
        if (sale.buyer_id.toString() !== buyerId) {
            return res.status(403).json({ message: "Only the buyer can rate this sale" });
        }
        sale.seller_rating = rating;
        await sale.save();
        await (0, user_1.recomputeUserRating)(sale.seller_id);
        return res.status(200).json({ sale: shapeSale(sale) });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Could not submit rating" });
    }
}
exports.rateSale = rateSale;
