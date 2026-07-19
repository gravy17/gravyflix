import { Router } from "express";
import {
  handleLogout,
  renderDashboard,
  renderHome,
  renderLogin,
  renderMovie,
  renderSignup,
} from "../controllers/pages";
import { renderTrade } from "../controllers/trades";
import { renderSale, completePurchase } from "../controllers/sales";
import { renderMockpayCheckout } from "../controllers/mockpay";

const router = Router();

router.get("/", renderHome);

router.get("/my-movies", renderDashboard);

router.get("/login", renderLogin);

router.get("/register", renderSignup);

router.get("/logout", handleLogout);

router.get("/trades/:id", renderTrade);

router.get("/sales/:id", renderSale);

router.get("/sales/:id/complete", completePurchase);

router.get("/mockpay/checkout", renderMockpayCheckout);

router.get("/:id", renderMovie);

export default router;
