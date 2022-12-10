"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMovie = exports.addOrUpdateMovie = exports.updateMovie = exports.addMovie = exports.getMovie = exports.getMovies = void 0;
const uuid_1 = require("uuid");
const Movie_1 = require("../models/Movie");
const User_1 = require("../models/User");
const utils_1 = require("../utils/utils");
async function getMovies(req, res, next) {
    try {
        const limit = req.query?.limit;
        const offset = req.query?.offset;
        const record = await Movie_1.Movies.findAndCountAll({
            attributes: ["id", "title", "description", "image", "price"],
            include: [
                {
                    model: User_1.Users,
                    attributes: ["username"],
                    as: "creator",
                },
            ],
            limit,
            offset,
            order: [["updatedAt", "DESC"]],
        });
        res.status(200).json({
            message: "Movies found",
            count: record.count,
            records: record.rows,
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
        const record = await Movie_1.Movies.findOne({ where: { id } });
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
    const id = (0, uuid_1.v4)();
    try {
        const validationResult = utils_1.movieValidator.validate(req.body, utils_1.validationOpts);
        if (validationResult.error) {
            return res.status(400).json({
                message: validationResult.error.details[0].message,
            });
        }
        const duplicate = await Movie_1.Movies.findOne({
            where: {
                title: req.body.title,
                createdBy: req.user,
            },
        });
        if (duplicate) {
            return res.status(400).json({
                message: "Movie already exists",
            });
        }
        const created = await Movie_1.Movies.create({
            ...req.body,
            id,
            createdBy: req.user,
        });
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
        const record = await Movie_1.Movies.findOne({ where: { id } });
        if (!record) {
            return res.status(404).json({
                message: "Movie not found",
            });
        }
        if (req.user !== record.getDataValue("createdBy")) {
            return res.status(403).json({
                message: "You are not authorized to update this movie",
            });
        }
        const updated = await record.update({
            title,
            description,
            image,
            price,
        });
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
        const record = await Movie_1.Movies.findOne({ where: { title, createdBy: req.user } });
        if (!record) {
            const updated = await Movie_1.Movies.create({
                ...req.body,
                id: (0, uuid_1.v4)(),
                createdBy: req.user,
            });
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
        const record = await Movie_1.Movies.findOne({ where: { id } });
        if (!record) {
            return res.status(404).json({
                message: "Movie not found",
            });
        }
        if (req.user !== record.getDataValue("createdBy")) {
            return res.status(403).json({
                message: "You are not authorized to delete this movie",
            });
        }
        const deleted = await record.destroy();
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
