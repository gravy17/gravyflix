import { Router } from "express";
import { auth } from "../middleware/auth";

import {
  addMovie,
  getMovie,
  updateMovie,
  addOrUpdateMovie,
  deleteMovie,
  listMovies,
  searchMovies,
  myCatalog,
} from "../controllers/movie";
import { buyMovie } from "../controllers/sales";
import { proposeTrade } from "../controllers/trades";

const router = Router();

router.get("/search", searchMovies);
router.get("/mine", auth, myCatalog);

router.get("/", listMovies);
router.post("/", auth, addMovie);
router.put("/", auth, addOrUpdateMovie);

router.get("/:id", getMovie);
router.patch("/:id", auth, updateMovie);
router.delete("/:id", auth, deleteMovie);
router.post("/:id/buy", auth, buyMovie);
router.post("/:id/trade", auth, proposeTrade);

export default router;
