import { Request, Response, NextFunction } from "express";
import { Movies } from "../models/Movie";
import { Users } from "../models/User";
import { verify } from "jsonwebtoken";

const title = process.env.APP_NAME;
const secret = process.env.JWT_SECRET as string;

const send404 = (req: Request, res: Response, err: any) => {
  return res.status(404).render("404", {
    status: 404,
    message:
      "The page you're looking for was not found. Try checking your url for spelling mistakes",
    title: title + " | 404",
    user: req.cookies.username,
  });
};

const send500 = (req: Request, res: Response, err: any) => {
  return res.status(500).render("500", {
    status: 500,
    message:
      "The server encountered a problem while processing your request. We'll have this fixed soon",
    title: title + " | 500",
    user: req.cookies.username,
  });
};

export async function renderLogin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.status(200).render("login", {
    title: title + " | Login",
    user: req.cookies.username,
  });
}

export async function renderSignup(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.status(200).render("register", {
    title: title + " | Signup",
    user: req.cookies.username,
  });
}

export async function renderHome(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const limit = req.query?.limit as number | undefined;
    const offset = req.query?.offset as number | undefined;
    const user = req.cookies.username;
    const movies = await Movies.findAll({
      limit,
      offset,
      order: [["updatedAt", "DESC"]],
    });
    res.status(200).render("index", { movies, title: title + " | Home", user });
  } catch (error) {
    return send500(req, res, error);
  }
}

export async function renderDashboard(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { token, username } = req.cookies;
    if (token) {
      const verified = verify(token, secret);
      if (!!verified) {
        const { id } = verified as { [key: string]: string };
        const movies = await Movies.findAndCountAll({
          where: { createdBy: id },
          include: [{ model: Users, as: "creator", attributes: ["username"] }],
          order: [["updatedAt", "DESC"]],
        });
        if (!!movies.rows) {
          return res.status(200).render("dashboard", {
            title: title + " | Your Movies",
            user: username,
            movies: movies.rows,
          });
        }
      }
    }
  } catch (error) {
    return send500(req, res, error);
  }
}

export async function renderMovie(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const movie = await Movies.findOne({ where: { id } });
    if (!movie) {
      return send404(req, res, { message: "Page Not Found" });
    }
    res.status(200).render("movie", {
      movie,
      title: title + " | " + movie.getDataValue("title"),
      user: req.cookies.username,
    });
  } catch (error) {
    return send500(req, res, error);
  }
}

export async function handleLogout(
  req: Request,
  res: Response,
  next: NextFunction
) {
  delete req.user;
  res
    .cookie("token", "", { expires: new Date(0) })
    .cookie("username", "", { expires: new Date(0) })
    .status(200)
    .redirect("/");
}
