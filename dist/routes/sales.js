"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const sales_1 = require("../controllers/sales");
const router = (0, express_1.Router)();
router.get("/", auth_1.auth, sales_1.listSales);
router.post("/:id/rate", auth_1.auth, sales_1.rateSale);
exports.default = router;
