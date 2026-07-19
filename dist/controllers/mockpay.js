"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderMockpayCheckout = void 0;
const mockpay_provider_1 = require("./mockpay-provider");
const title = process.env.APP_NAME;
/*
  GET /mockpay/checkout?reference=<external reference>

  This is the page providerInitialize()'s authorization_url points to --
  i.e. what a cardholder actually sees on "MockPay". It intentionally only
  knows about the external reference, email, amount, and callback_url,
  the same information a real gateway's hosted checkout would have. It
  does not look up your Sale/Movie records -- that would leak internal
  data a real third party would never have access to.
*/
async function renderMockpayCheckout(req, res, next) {
    try {
        const reference = req.query.reference;
        if (!reference) {
            return res.status(400).send("Missing payment reference");
        }
        const record = (0, mockpay_provider_1.getMockTransaction)(reference);
        if (!record) {
            return res.status(404).send("We couldn't find this payment");
        }
        if (record.status === "success") {
            // Already confirmed -- send them straight back to the callback
            // instead of letting them "pay" a second time.
            const url = new URL(record.callback_url);
            url.searchParams.set("reference", reference);
            return res.redirect(url.toString());
        }
        return res.status(200).render("mockpay", {
            title: title + " | MockPay checkout",
            reference,
            amount: record.amount,
            callbackUrl: record.callback_url,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).send("Something went wrong loading checkout");
    }
}
exports.renderMockpayCheckout = renderMockpayCheckout;
