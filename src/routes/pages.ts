import { Router } from "express";
import {
  handleLogout,
  renderDashboard,
  renderHome,
  renderLogin,
  renderMovie,
  renderSignup,
} from "../controllers/pages";

const router = Router();

router.get("/", renderHome);

router.get("/my-movies", renderDashboard);

router.get("/login", renderLogin);

router.get("/register", renderSignup);

router.get("/logout", handleLogout);

router.get("/:id", renderMovie);

export default router;
