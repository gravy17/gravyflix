"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.myCatalog = exports.searchMovies = exports.listMovies = exports.deleteMovie = exports.addOrUpdateMovie = exports.updateMovie = exports.addMovie = exports.getMovie = exports.getMovies = void 0;
const Movie_1 = __importDefault(require("../models/Movie"));
const image_utils_1 = require("../utils/image-utils");
const shared_1 = require("../utils/shared");
const validation_1 = require("../utils/validation");
const POPULATE_USER = "username fullname city country_code rating";
async function getMovies(req, res, next) {
    try {
        const limit = Number(req.query?.limit) || 5;
        const offset = Number(req.query?.offset) || 0;
        const records = await Movie_1.default.find({}).sort({ createdAt: 1 }).limit(limit).skip(offset).populate('createdBy', 'username');
        res.status(200).json({
            message: "Movies found",
            records
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unexpected error: Failed to get movies",
        });
    }
}
exports.getMovies = getMovies;
async function getMovie(req, res, next) {
    try {
        const { id } = req.params;
        const record = await Movie_1.default.findById(id);
        if (!record) {
            return res.status(404).json({
                message: "Movie not found",
            });
        }
        return res.status(200).json({
            message: "Movie found",
            record,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unexpected error: Failed to get movie",
            id: req.params.id,
        });
    }
}
exports.getMovie = getMovie;
async function addMovie(req, res, next) {
    try {
        const validationResult = validation_1.movieValidator.validate(req.body, validation_1.validationOpts);
        if (validationResult.error) {
            return res.status(400).json({
                message: validationResult.error.details[0].message,
            });
        }
        const duplicate = await Movie_1.default.findOne({
            title: req.body.title,
            createdBy: req.user,
        });
        if (duplicate) {
            return res.status(400).json({
                message: "Movie already exists",
            });
        }
        const { image, ...rest } = req.body;
        const payload = {
            ...rest,
            createdBy: req.user,
        };
        if (image) {
            const fileName = `${req.body.title}-${Date.now()}.jpg`;
            const uploadedImageUrl = await (0, image_utils_1.uploadImage)(image, fileName, req.user?.toString() || "unknown");
            payload.image = uploadedImageUrl || image;
        }
        const newMovie = new Movie_1.default(payload);
        const created = await newMovie.save();
        res.status(201).json({
            message: "Movie successfully added",
            created,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unexpected error: Failed to create movie",
        });
    }
}
exports.addMovie = addMovie;
async function updateMovie(req, res, next) {
    try {
        const { id } = req.params;
        const { title, description, image, price } = req.body;
        const validationResult = validation_1.movieModValidator.validate(req.body, validation_1.validationOpts);
        if (validationResult.error) {
            return res.status(400).json({
                message: validationResult.error.details[0].message,
            });
        }
        const record = await Movie_1.default.findById({ _id: id });
        if (!record) {
            return res.status(404).json({
                message: "Movie not found",
            });
        }
        if (req.user !== record.createdBy?.toString()) {
            return res.status(403).json({
                message: "You are not authorized to update this movie",
            });
        }
        let resolvedImage = image;
        if (image) {
            const fileName = `${title || record.title}-${Date.now()}.jpg`;
            const uploadedImageUrl = await (0, image_utils_1.uploadImage)(image, fileName, req.user?.toString() || "unknown");
            resolvedImage = uploadedImageUrl || image;
        }
        await record.update({
            title,
            description,
            image: resolvedImage,
            price,
        });
        const updated = await Movie_1.default.findById(id);
        res.status(200).json({
            message: "Movie successfully updated",
            updated,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unexpected error: Failed to update movie",
            id: req.params.id,
        });
    }
}
exports.updateMovie = updateMovie;
async function addOrUpdateMovie(req, res, next) {
    try {
        const { title, description, image, price } = req.body;
        const validationResult = validation_1.movieValidator.validate(req.body, validation_1.validationOpts);
        if (validationResult.error) {
            return res.status(400).json({
                message: validationResult.error.details[0].message,
            });
        }
        const record = await Movie_1.default.findOne({ title: title, createdBy: req.user });
        if (!record) {
            const { image: imageUrl, ...rest } = req.body;
            const payload = {
                ...rest,
                createdBy: req.user,
            };
            if (imageUrl) {
                const fileName = `${title}-${Date.now()}.jpg`;
                const uploadedImageUrl = await (0, image_utils_1.uploadImage)(imageUrl, fileName, req.user?.toString() || "unknown");
                payload.image = uploadedImageUrl || imageUrl;
            }
            const newMovie = new Movie_1.default(payload);
            const updated = await newMovie.save();
            return res.status(201).json({
                message: "Movie successfully added",
                updated,
            });
        }
        else {
            let resolvedImage = image;
            if (image) {
                const fileName = `${title || record.title}-${Date.now()}.jpg`;
                const uploadedImageUrl = await (0, image_utils_1.uploadImage)(image, fileName, req.user?.toString() || "unknown");
                resolvedImage = uploadedImageUrl || image;
            }
            const updated = await record.update({
                title,
                description,
                image: resolvedImage,
                price,
            });
            return res.status(200).json({
                message: "Movie successfully updated",
                updated,
            });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unexpected error: Failed to add/update movie",
            id: req.params.id,
        });
    }
}
exports.addOrUpdateMovie = addOrUpdateMovie;
async function deleteMovie(req, res, next) {
    try {
        const { id } = req.params;
        const record = await Movie_1.default.findById(id);
        if (!record) {
            return res.status(404).json({
                message: "Movie not found",
            });
        }
        if (req.user !== record.createdBy?.toString()) {
            return res.status(403).json({
                message: "You are not authorized to delete this movie",
            });
        }
        const deleted = await Movie_1.default.deleteOne({ _id: id });
        return res.status(200).json({
            message: "Movie successfully deleted",
            deleted,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unexpected error: Failed to delete movie",
            id: req.params.id,
        });
    }
}
exports.deleteMovie = deleteMovie;
/* ---------- API: GET /api/movies?format=&limit=&offset= ---------- */
// format arrives as the slug the frontend builds from the enum value
// (e.g. "16mm reel" -> "16mm-reel", "Blu-ray" -> "blu-ray").
async function listMovies(req, res) {
    try {
        const limit = Number(req.query.limit) || 20;
        const offset = Number(req.query.offset) || 0;
        const format = req.query.format;
        const filter = { active: { $ne: false } };
        if (format && format !== "all") {
            filter.format = format;
        }
        console.log("listMovies filter:", JSON.stringify(filter), "limit:", limit, "offset:", offset);
        const movies = await Movie_1.default.find(filter)
            .sort({ createdAt: 1 })
            .limit(limit)
            .skip(offset)
            .populate("createdBy", POPULATE_USER);
        return res.status(200).json({ movies: movies.map(shared_1.shapeMovie) });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Could not load movies" });
    }
}
exports.listMovies = listMovies;
/* ---------- API: GET /api/movies/search?q= ---------- */
// Scoped to title/description/format for now -- searching by seller name
// would need an aggregation pipeline ($lookup on createdBy) since it's a
// ref, not a plain field.
async function searchMovies(req, res) {
    try {
        const q = (req.query.q || "").trim();
        if (!q)
            return res.status(200).json({ movies: [] });
        const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        const movies = await Movie_1.default.find({
            active: { $ne: false },
            $or: [{ title: regex }, { description: regex }, { format: regex }],
        })
            .limit(30)
            .populate("createdBy", POPULATE_USER);
        return res.status(200).json({ movies: movies.map(shared_1.shapeMovie) });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Search failed" });
    }
}
exports.searchMovies = searchMovies;
/* ---------- API: GET /api/movies/mine ---------- */
// Powers the "offer one of your movies" dropdown in the trade modal.
// Requires the `auth` middleware ahead of this route.
async function myCatalog(req, res) {
    try {
        const userId = req.user;
        const movies = await Movie_1.default.find({
            createdBy: userId,
            active: { $ne: false },
        }).sort({ createdAt: -1 });
        return res.status(200).json({ movies: movies.map(shared_1.shapeMovie) });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Could not load your catalog" });
    }
}
exports.myCatalog = myCatalog;
