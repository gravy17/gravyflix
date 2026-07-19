"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPayment = exports.initiatePayment = void 0;
async function initiatePayment(customerEmail, amount, callbackUrl) {
    const response = await fetch(`${process.env.MOCKPAY_URL}/transaction/initialize`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.MOCKPAY_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: customerEmail,
            amount: amount,
            callback_url: callbackUrl
        }),
    });
    const data = await response.json();
    return data.data.authorization_url;
}
exports.initiatePayment = initiatePayment;
async function verifyPayment(reference) {
    const result = await fetch(`${process.env.MOCKPAY_URL}/transaction/verify/${reference}`, {
        headers: {
            Authorization: `Bearer ${process.env.MOCKPAY_API_KEY}`,
        },
    });
    const payment = await result.json();
    if (payment.data.status === "success") {
        return true;
    }
    return false;
}
exports.verifyPayment = verifyPayment;
