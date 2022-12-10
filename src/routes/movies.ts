import { Router } from "express";
import { auth } from "../middleware/auth";
import {
  addMovie,
  getMovies,
  getMovie,
  updateMovie,
  addOrUpdateMovie,
  deleteMovie,
} from "../controllers/movie";

const router = Router();

router.get("/", getMovies);
router.post("/", auth, addMovie);
router.put("/", auth, addOrUpdateMovie);
router.get("/:id", getMovie);
router.patch("/:id", auth, updateMovie);
router.delete("/:id", auth, deleteMovie);

export default router;
