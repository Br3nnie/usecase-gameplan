import { fulfilGameplanPurchase } from "../../lib/stripe-purchase.js";
import { createSessionToken, sessionCookie } from "../../lib/session.js";

function redirect(res, destination) {
  res.setHeader("Location", destination);
  return res.status(303).end();
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const appUrl = process.env.APP_URL;
  if (!appUrl) return res.status(500).json({ error: "APP_URL is not configured" });
  const sessionId = typeof req.query.session_id === "string" ? req.query.session_id : "";
  if (!/^cs_(test_|live_)[A-Za-z0-9]+$/.test(sessionId)) return redirect(res, `${appUrl}/?access=payment-error`);

  try {
    const purchase = await fulfilGameplanPurchase({ id: sessionId });
    const token = await createSessionToken(purchase.email);
    res.setHeader("Set-Cookie", sessionCookie(token));
    return redirect(res, `${appUrl}/?purchase=success`);
  } catch (error) {
    console.error("Stripe Checkout completion failed:", error.message);
    return redirect(res, `${appUrl}/?access=payment-error`);
  }
}
