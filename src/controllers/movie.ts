import { Request, Response, NextFunction } from "express";
import Movie from "../models/Movie";
import { uploadImage } from "../utils/image-utils";
import { shapeMovie } from "../utils/shared";

import {
  movieValidator,
  movieModValidator,
  validationOpts,
} from "../utils/validation";

const POPULATE_USER = "username fullname city country_code rating";


export async function getMovies(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const limit = Number(req.query?.limit as string) || 5;
    const offset = Number(req.query?.offset as string) || 0;
    const records = await Movie.find({}).sort({ createdAt: 1 }).limit(limit).skip(offset).populate('createdBy', 'username');
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

    const { image, ...rest } = req.body;
    const payload = {
      ...rest,
      createdBy: req.user,
    } as Record<string, unknown>;

    if (image) {
      const fileName = `${req.body.title}-${Date.now()}.jpg`;
      const uploadedImageUrl = await uploadImage(image, fileName, req.user?.toString() || "unknown");
      payload.image = uploadedImageUrl || image;
    }

    const newMovie = new Movie(payload);

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

    let resolvedImage = image;
    if (image) {
      const fileName = `${title || record.title}-${Date.now()}.jpg`;
      const uploadedImageUrl = await uploadImage(image, fileName, req.user?.toString() || "unknown");
      resolvedImage = uploadedImageUrl || image;
    }

    await record.update({
      title,
      description,
      image: resolvedImage,
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
      const { image: imageUrl, ...rest } = req.body;
      const payload = {
        ...rest,
        createdBy: req.user,
      } as Record<string, unknown>;

      if (imageUrl) {
        const fileName = `${title}-${Date.now()}.jpg`;
        const uploadedImageUrl = await uploadImage(imageUrl, fileName, req.user?.toString() || "unknown");
        payload.image = uploadedImageUrl || imageUrl;
      }

      const newMovie = new Movie(payload);
      const updated = await newMovie.save();
      return res.status(201).json({
        message: "Movie successfully added",
        updated,
      });
    } else {
      let resolvedImage = image;
      if (image) {
        const fileName = `${title || record.title}-${Date.now()}.jpg`;
        const uploadedImageUrl = await uploadImage(image, fileName, req.user?.toString() || "unknown");
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

/* ---------- API: GET /api/movies?format=&limit=&offset= ---------- */
// format arrives as the slug the frontend builds from the enum value
// (e.g. "16mm reel" -> "16mm-reel", "Blu-ray" -> "blu-ray").
export async function listMovies(req: Request, res: Response) {
  try {
    const limit = Number(req.query.limit as string) || 20;
    const offset = Number(req.query.offset as string) || 0;
    const format = req.query.format as string;

    const filter: any = { active: { $ne: false } };
    if (format && format !== "all") {
      filter.format = format;
    }

    console.log("listMovies filter:", JSON.stringify(filter), "limit:", limit, "offset:", offset);
    const movies = await Movie.find(filter)
      .sort({ createdAt: 1 })
      .limit(limit)
      .skip(offset)
      .populate("createdBy", POPULATE_USER);

    return res.status(200).json({ movies: movies.map(shapeMovie) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not load movies" });
  }
}

/* ---------- API: GET /api/movies/search?q= ---------- */
// Scoped to title/description/format for now -- searching by seller name
// would need an aggregation pipeline ($lookup on createdBy) since it's a
// ref, not a plain field.
export async function searchMovies(req: Request, res: Response) {
  try {
    const q = ((req.query.q as string) || "").trim();
    if (!q) return res.status(200).json({ movies: [] });

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const movies = await Movie.find({
      active: { $ne: false },
      $or: [{ title: regex }, { description: regex }, { format: regex }],
    })
      .limit(30)
      .populate("createdBy", POPULATE_USER);

    return res.status(200).json({ movies: movies.map(shapeMovie) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Search failed" });
  }
}

/* ---------- API: GET /api/movies/mine ---------- */
// Powers the "offer one of your movies" dropdown in the trade modal.
// Requires the `auth` middleware ahead of this route.
export async function myCatalog(req: Request, res: Response) {
  try {
    const userId = req.user;
    const movies = await Movie.find({
      createdBy: userId,
      active: { $ne: false },
    }).sort({ createdAt: -1 });

    return res.status(200).json({ movies: movies.map(shapeMovie) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not load your catalog" });
  }
}