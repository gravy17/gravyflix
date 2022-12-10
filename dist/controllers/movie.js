"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMovie = exports.addOrUpdateMovie = exports.updateMovie = exports.addMovie = exports.getMovie = exports.getMovies = void 0;
const Movie_1 = __importDefault(require("../models/Movie"));
const utils_1 = require("../utils/utils");
async function getMovies(req, res, next) {
    try {
        const limit = Number(req.query?.limit) || 5;
        const offset = Number(req.query?.offset) || 0;
        const records = await Movie_1.default.find({}).sort({ createdAt: 1 }).limit(limit).skip(offset);
        res.status(200).json({
            message: "Movies found",
            records
        });
    }
    catch (error) {
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
        res.status(500).json({
            message: "Unexpected error: Failed to get movie",
            id: req.params.id,
        });
    }
}
exports.getMovie = getMovie;
async function addMovie(req, res, next) {
    try {
        const validationResult = utils_1.movieValidator.validate(req.body, utils_1.validationOpts);
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
        const newMovie = new Movie_1.default({
            ...req.body,
            createdBy: req.user,
        });
        const created = await newMovie.save();
        res.status(201).json({
            message: "Movie successfully added",
            created,
        });
    }
    catch (err) {
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
        const validationResult = utils_1.movieModValidator.validate(req.body, utils_1.validationOpts);
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
        await record.update({
            title,
            description,
            image,
            price,
        });
        const updated = await Movie_1.default.findById(id);
        res.status(200).json({
            message: "Movie successfully updated",
            updated,
        });
    }
    catch (error) {
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
        const validationResult = utils_1.movieValidator.validate(req.body, utils_1.validationOpts);
        if (validationResult.error) {
            return res.status(400).json({
                message: validationResult.error.details[0].message,
            });
        }
        const record = await Movie_1.default.findOne({ title: title, createdBy: req.user });
        if (!record) {
            const newMovie = new Movie_1.default({
                ...req.body,
                createdBy: req.user,
            });
            const updated = await newMovie.save();
            return res.status(201).json({
                message: "Movie successfully added",
                updated,
            });
        }
        else {
            const updated = await record.update({
                title,
                description,
                image,
                price,
            });
            return res.status(200).json({
                message: "Movie successfully updated",
                updated,
            });
        }
    }
    catch (error) {
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
        res.status(500).json({
            message: "Unexpected error: Failed to delete movie",
            id: req.params.id,
        });
    }
}
exports.deleteMovie = deleteMovie;
