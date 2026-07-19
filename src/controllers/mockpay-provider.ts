import { Request, Response } from "express";
import { randomBytes } from "crypto";

/*
  This file simulates the EXTERNAL MockPay gateway that initiatePayment()/
  verifyPayment() (in utils/payment.ts) call over HTTP. It is not part of
  your app's own business logic -- it's a stand-in for a third party, so
  it deliberately knows nothing about Sale, Movie, or transaction_id. All
  it knows is: an email, an amount, a callback_url, and its own reference.

  Point MOCKPAY_URL at wherever this gets mounted (e.g.
  `${APP_URL}/mockpay-provider`) in dev/test envs, and MOCKPAY_API_KEY at
  any string -- initiatePayment()/verifyPayment() don't need to change at
  all, since this speaks the same shape a real gateway would.

  State is an in-memory Map, which is fine for local dev/testing but will
  not survive a server restart or work across multiple instances -- swap
  for a real sandbox account (e.g. Paystack's actual test mode) before
  anything resembling production.
*/

type MockTransaction = {
  email: string;
  amount: number;
  callback_url: string;
  status: "pending" | "success" | "failed";
};

const transactions = new Map<string, MockTransaction>();

function generateReference(): string {
  return "MPR_" + randomBytes(8).toString("hex");
}

function checkApiKey(req: Request, res: Response): boolean {
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
export async function providerInitialize(req: Request, res: Response) {
  if (!checkApiKey(req, res)) return;

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

/* ---------- GET /transaction/verify/:reference ---------- */
// Server-to-server, called by verifyPayment().
export async function providerVerify(req: Request, res: Response) {
  if (!checkApiKey(req, res)) return;

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

/* ---------- POST /transaction/confirm/:reference ---------- */
// NOT server-to-server -- this is called directly from the browser by
// mockpay.js, standing in for a cardholder submitting details on the real
// gateway's own hosted page. No API key: a real gateway's checkout page
// doesn't have your secret key either, it authenticates the browser
// session some other way entirely.
export async function providerConfirm(req: Request, res: Response) {
  const { reference } = req.params;
  const record = transactions.get(reference);
  if (!record) {
    return res.status(404).json({ status: false, message: "Transaction not found" });
  }

  record.status = "success";
  return res.status(200).json({ status: true, callback_url: record.callback_url });
}

// Used by the checkout PAGE controller (controllers/mockpay.ts) to read
// transaction details directly, in-process, instead of making an HTTP
// call to itself.
export function getMockTransaction(reference: string): MockTransaction | undefined {
  return transactions.get(reference);
}
