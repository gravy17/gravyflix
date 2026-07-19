import { Router } from "express";
import {
  providerInitialize,
  providerVerify,
  providerConfirm,
} from "../controllers/mockpay-provider";

const router = Router();

router.post("/transaction/initialize", providerInitialize);
router.get("/transaction/verify/:reference", providerVerify);
router.post("/transaction/confirm/:reference", providerConfirm);

export default router;

// Mount as: app.use("/mockpay-provider", router)
// Then set MOCKPAY_URL=${APP_URL}/mockpay-provider and MOCKPAY_API_KEY to
// any string in your dev/test env -- initiatePayment()/verifyPayment() in
// utils/payment.ts don't need any changes to talk to this.
