const MOCKPAY_URL = `${process.env.APP_URL}/mockpay-provider`;

export async function initiatePayment(customerEmail: string, amount: number, callbackUrl: string): Promise<string> {
    const response = await fetch(
        `${MOCKPAY_URL}/transaction/initialize`,
        {
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
        }
    );

    const data = await response.json();

    return data.data.authorization_url;
}

export async function verifyPayment(reference: string): Promise<boolean> {
    const result = await fetch(
        `${MOCKPAY_URL}/transaction/verify/${reference}`,
        {
            headers: {
                Authorization: `Bearer ${process.env.MOCKPAY_API_KEY}`,
            },
        }
    );

    const payment = await result.json();

    if (payment.data.status === "success") {
        return true;
    }
    return false;
}