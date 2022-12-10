import createError from "http-errors";
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import db from "./config/database.config";

import pagesRouter from "./routes/pages";
import moviesRouter from "./routes/movies";
import usersRouter from "./routes/users";
const APP_NAME = process.env.APP_NAME;

db.sync({ force: false })
  .then(() => {
    console.info("Database connected succcesfully");
  })
  .catch((err) => {
    console.error(err);
  });

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "..", "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/", pagesRouter);
app.use("/api", usersRouter);
app.use("/api/movies", moviesRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (
  err: createError.HttpError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  if (err.status === 404) {
    res.render("404", {
      status: 404,
      message:
        "The page you're looking for was not found. Try checking your url for spelling mistakes",
      error: res.locals.error,
      title: APP_NAME + " | 404",
      user: req.user,
    });
  } else {
    res.render("500", {
      status: 500,
      message:
        "The server encountered a problem while processing your request. We'll have this fixed soon",
      error: res.locals.error,
      title: APP_NAME + " | 500",
      user: req.user,
    });
  }
});

export default app;
