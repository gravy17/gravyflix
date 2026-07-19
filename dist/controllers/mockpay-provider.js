"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMockTransaction = exports.providerConfirm = exports.providerVerify = exports.providerInitialize = void 0;
const crypto_1 = require("crypto");
const transactions = new Map();
function generateReference() {
    return "MPR_" + (0, crypto_1.randomBytes)(8).toString("hex");
}
function checkApiKey(req, res) {
    const header = req.headers.authorization;
    const key = header?.slice(7); // strip "Bearer "
    if (!key || key !== process.env.MOCKPAY_API_KEY) {
        res.status(401).json({ status: false, message: "Invalid or missing API key" });
        return false;
    }
    return true;
}
/* ---------- POST /transaction/initialize ---------- */
// Server-to-server, called by initiatePayment().
async function providerInitialize(req, res) {
    if (!checkApiKey(req, res))
        return;
    const { email, amount, callback_url } = req.body;
    if (!email || !amount || !callback_url) {
        return res.status(400).json({
            status: false,
            message: "email, amount, and callback_url are required",
        });
    }
    const reference = generateReference();
    transactions.set(reference, { email, amount, callback_url, status: "pending" });
    const authorization_url = `${process.env.APP_URL}/mockpay/checkout?reference=${reference}`;
    return res.status(200).json({
        status: true,
        message: "Authorization URL created",
        data: {
            authorization_url,
            access_code: reference,
            reference,
        },
    });
}
exports.providerInitialize = providerInitialize;
/* ---------- GET /transaction/verify/:reference ---------- */
// Server-to-server, called by verifyPayment().
async function providerVerify(req, res) {
    if (!checkApiKey(req, res))
        return;
    const { reference } = req.params;
    const record = transactions.get(reference);
    if (!record) {
        return res.status(404).json({ status: false, message: "Transaction not found" });
    }
    return res.status(200).json({
        status: true,
        message: "Verification result",
        data: {
            status: record.status,
            reference,
            amount: record.amount,
        },
    });
}
exports.providerVerify = providerVerify;
/* ---------- POST /transaction/confirm/:reference ---------- */
// NOT server-to-server -- this is called directly from the browser by
// mockpay.js, standing in for a cardholder submitting details on the real
// gateway's own hosted page. No API key: a real gateway's checkout page
// doesn't have your secret key either, it authenticates the browser
// session some other way entirely.
async function providerConfirm(req, res) {
    const { reference } = req.params;
    const record = transactions.get(reference);
    if (!record) {
        return res.status(404).json({ status: false, message: "Transaction not found" });
    }
    record.status = "success";
    return res.status(200).json({ status: true, callback_url: record.callback_url });
}
exports.providerConfirm = providerConfirm;
// Used by the checkout PAGE controller (controllers/mockpay.ts) to read
// transaction details directly, in-process, instead of making an HTTP
// call to itself.
function getMockTransaction(reference) {
    return transactions.get(reference);
}
exports.getMockTransaction = getMockTransaction;
