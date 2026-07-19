"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mockpay_provider_1 = require("../controllers/mockpay-provider");
const router = (0, express_1.Router)();
router.post("/transaction/initialize", mockpay_provider_1.providerInitialize);
router.get("/transaction/verify/:reference", mockpay_provider_1.providerVerify);
router.post("/transaction/confirm/:reference", mockpay_provider_1.providerConfirm);
exports.default = router;
// Mount as: app.use("/mockpay-provider", router)
// Then set MOCKPAY_URL=${APP_URL}/mockpay-provider and MOCKPAY_API_KEY to
// any string in your dev/test env -- initiatePayment()/verifyPayment() in
// utils/payment.ts don't need any changes to talk to this.
