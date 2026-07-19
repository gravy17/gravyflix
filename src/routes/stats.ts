import { Router } from "express";
import { getMarketplaceStats } from "../controllers/user";

const router = Router();

router.get("/marketplace", getMarketplaceStats);

export default router;

