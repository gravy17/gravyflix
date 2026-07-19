import { Router } from "express";
import { auth } from "../middleware/auth";
import { listSales, rateSale } from "../controllers/sales";

const router = Router();

router.get("/", auth, listSales);
router.post("/:id/rate", auth, rateSale);

export default router;
