import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { Movies } from "../models/Movie";
import { Users } from "../models/User";
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
    const limit = req.query?.limit as number | undefined;
    const offset = req.query?.offset as number | undefined;
    const record = await Movies.findAndCountAll({
      attributes: ["id", "title", "description", "image", "price"],
      include: [
        {
          model: Users,
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
  } catch (error) {
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
    const record = await Movies.findOne({ where: { id } });
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
  const id = uuidv4();
  try {
    const validationResult = movieValidator.validate(req.body, validationOpts);
    if (validationResult.error) {
      return res.status(400).json({
        message: validationResult.error.details[0].message,
      });
    }

    const duplicate = await Movies.findOne({
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

    const created = await Movies.create({
      ...req.body,
      id,
      createdBy: req.user,
    });
    res.status(201).json({
      message: "Movie successfully added",
      created,
    });
  } catch (err) {
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

    const record = await Movies.findOne({ where: { id } });
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
  } catch (error) {
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

    const record = await Movies.findOne({ where: { title, createdBy: req.user } });
    if (!record) {
      const updated = await Movies.create({
        ...req.body,
        id: uuidv4(),
        createdBy: req.user,
      });
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
    const record = await Movies.findOne({ where: { id } });
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
  } catch (error) {
    res.status(500).json({
      message: "Unexpected error: Failed to delete movie",
      id: req.params.id,
    });
  }
}
