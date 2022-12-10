import { Request, Response, NextFunction } from "express";
import Movie from "../models/Movie";
import User from "../models/User";
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
    const limit = Number(req.query?.limit as string) || 5;
    const offset = Number(req.query?.offset as string) || 0;
    const user = req.cookies.username;
    const movies = await Movie.find({}).sort({ createdAt: 1 }).limit(limit).skip(offset);
    if (!!movies.length){
      res.status(200).render("index", { movies, title: title + " | Home", user, limit, offset });
    } else  if (offset > 0) {
      res.status(404).redirect('/?limit=' + limit + '&offset=' + (offset - limit));
    } else {
      res.status(200).render("index", { movies, title: title + " | Home", user, limit, offset });
    }
  } catch (error) {
    console.error(error)
    return send500(req, res, error);
  }
}

export async function renderDashboard(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const limit = Number(req.query?.limit as string) || 5;
    const offset = Number(req.query?.offset as string) || 0;
    const { token, username } = req.cookies;
    if (token) {
      const verified = verify(token, secret);
      if (!!verified) {
        const { id } = verified as { [key: string]: string };
   
        const movies = await Movie.find({ createdBy: id }).sort({ createdAt: 1 }).limit(limit).skip(offset);
        return res.status(200).render("dashboard", {
          title: title + " | Your Movies",
          user: username,
          movies,
          limit, 
          offset
        });
      }
    }
  } catch (error) {
    console.error(error)
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
    const movie = await Movie.findById(id);
    if (!movie) {
      return send404(req, res, { message: "Page Not Found" });
    }
    res.status(200).render("movie", {
      movie,
      title: title + " | " + movie.title,
      user: req.cookies.username,
    });
  } catch (error) {
    console.error(error)
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
