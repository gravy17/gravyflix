import { Router } from "express";
import { auth } from "../middleware/auth";
import {
  listTrades,
  getTrade,
  confirmTrade,
  rateTrade,
} from "../controllers/trades";

const router = Router();

router.get("/", auth, listTrades);
router.get("/:id", auth, getTrade);
router.post("/:id/confirm", auth, confirmTrade);
router.post("/:id/rate", auth, rateTrade);

export default router;

