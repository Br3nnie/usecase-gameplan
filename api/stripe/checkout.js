import { GAMEPLAN_PRODUCT, GAMEPLAN_TIER, getStripe } from "../../lib/stripe-purchase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const appUrl = process.env.APP_URL;
  const salesUrl = process.env.SALES_URL || "https://corbelle.ai/usecasegameplan";
  const priceId = process.env.STRIPE_PRICE_GAMEPLAN;
  if (!appUrl || !priceId) return res.status(503).json({ error: "Checkout is not configured yet" });

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_creation: "always",
      success_url: `${appUrl}/api/stripe/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${salesUrl}#checkout`,
      metadata: { product: GAMEPLAN_PRODUCT, tier: GAMEPLAN_TIER },
      payment_intent_data: { metadata: { product: GAMEPLAN_PRODUCT, tier: GAMEPLAN_TIER } },
    });

    res.setHeader("Location", session.url);
    return res.status(303).end();
  } catch (error) {
    console.error("Stripe Checkout creation failed:", error.message);
    return res.status(500).json({ error: "Could not start secure checkout" });
  }
}
