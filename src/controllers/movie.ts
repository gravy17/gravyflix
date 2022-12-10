import { Request, Response, NextFunction } from "express";
import Movie from "../models/Movie";

import {
  movieValidator,
  movieModValidator,
  validationOpts,
} from "../utils/utils";

export async function getMovies(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const limit = Number(req.query?.limit as string) || 5;
    const offset = Number(req.query?.offset as string) || 0;
    const records = await Movie.find({}).sort({ createdAt: 1 }).limit(limit).skip(offset);
    res.status(200).json({
      message: "Movies found",
      records
    });
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: "Unexpected error: Failed to get movies",
    });
  }
}

export async function getMovie(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const record = await Movie.findById(id);
    if (!record) {
      return res.status(404).json({
        message: "Movie not found",
      });
    }
    return res.status(200).json({
      message: "Movie found",
      record,
    });
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: "Unexpected error: Failed to get movie",
      id: req.params.id,
    });
  }
}

export async function addMovie(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const validationResult = movieValidator.validate(req.body, validationOpts);
    if (validationResult.error) {
      return res.status(400).json({
        message: validationResult.error.details[0].message,
      });
    }

    const duplicate = await Movie.findOne({
      title: req.body.title,
      createdBy: req.user,
    });

    if (duplicate) {
      return res.status(400).json({
        message: "Movie already exists",
      });
    }

    const newMovie = new Movie({
      ...req.body,
      createdBy: req.user,
    });

    const created = await newMovie.save();
    res.status(201).json({
      message: "Movie successfully added",
      created,
    });
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: "Unexpected error: Failed to create movie",
    });
  }
}

export async function updateMovie(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const { title, description, image, price } = req.body;
    const validationResult = movieModValidator.validate(
      req.body,
      validationOpts
    );
    if (validationResult.error) {
      return res.status(400).json({
        message: validationResult.error.details[0].message,
      });
    }

    const record = await Movie.findById({ _id: id });
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
    const updated = await Movie.findById(id);
    res.status(200).json({
      message: "Movie successfully updated",
      updated,
    });
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: "Unexpected error: Failed to update movie",
      id: req.params.id,
    });
  }
}

export async function addOrUpdateMovie(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { title, description, image, price } = req.body;
    const validationResult = movieValidator.validate(
      req.body,
      validationOpts
    );
    if (validationResult.error) {
      return res.status(400).json({
        message: validationResult.error.details[0].message,
      });
    }

    const record = await Movie.findOne({ title: title, createdBy: req.user });
    if (!record) {
      const newMovie = new Movie({
        ...req.body,
        createdBy: req.user,
      });
      const updated = await newMovie.save();
      return res.status(201).json({
        message: "Movie successfully added",
        updated,
      });
    } else {
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
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: "Unexpected error: Failed to add/update movie",
      id: req.params.id,
    });
  }
}

export async function deleteMovie(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const record = await Movie.findById(id);
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

    const deleted = await Movie.deleteOne({ _id: id });
    return res.status(200).json({
      message: "Movie successfully deleted",
      deleted,
    });
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: "Unexpected error: Failed to delete movie",
      id: req.params.id,
    });
  }
}
