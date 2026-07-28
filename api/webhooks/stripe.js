import { fulfilGameplanPurchase, getStripe, isPaidGameplanSession } from "../../lib/stripe-purchase.js";

export const config = { api: { bodyParser: false } };

async function rawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).json({ error: "Webhook is not configured" });

  try {
    const signature = req.headers["stripe-signature"];
    const event = getStripe().webhooks.constructEvent(
      await rawBody(req),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );

    if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
      const session = event.data.object;
      if (isPaidGameplanSession(session)) await fulfilGameplanPurchase(session);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Stripe webhook failed:", error.message);
    return res.status(400).json({ error: "Invalid webhook" });
  }
}
