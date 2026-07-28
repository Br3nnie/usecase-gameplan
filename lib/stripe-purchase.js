import Stripe from "stripe";
import { grantTier } from "./entitlements.js";
import { sendMagicLinkEmail } from "./mailer.js";
import { getRedis } from "./redis.js";
import { createMagicLink } from "./tokens.js";

export const GAMEPLAN_PRODUCT = "usecase-gameplan";
export const GAMEPLAN_TIER = "gameplan";

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export function isPaidGameplanSession(session) {
  const lineItem = session?.line_items?.data?.[0];
  const price = lineItem?.price;
  const paymentComplete = session?.payment_status === "paid"
    || session?.payment_status === "no_payment_required";

  return paymentComplete
    && session?.metadata?.product === GAMEPLAN_PRODUCT
    && session?.metadata?.tier === GAMEPLAN_TIER
    && lineItem?.quantity === 1
    && price?.id === process.env.STRIPE_PRICE_GAMEPLAN
    && price?.currency === "gbp"
    && price?.unit_amount === 700;
}

async function retrieveWithLineItems(session) {
  if (session?.line_items?.data?.length) return session;
  if (!session?.id) throw new Error("Checkout Session has no id");
  return getStripe().checkout.sessions.retrieve(session.id, {
    expand: ["line_items.data.price"],
  });
}

export async function fulfilGameplanPurchase(sessionRecord) {
  const session = await retrieveWithLineItems(sessionRecord);
  if (!isPaidGameplanSession(session)) throw new Error("Checkout Session is not a paid Gameplan order");

  const email = session.customer_details?.email || session.customer_email;
  if (!email) throw new Error("Checkout Session has no customer email");

  const redis = getRedis();
  const fulfilmentKey = `stripe:fulfilled:${session.id}`;
  const alreadyFulfilled = await redis.get(fulfilmentKey);

  await grantTier(email, GAMEPLAN_TIER);

  if (!alreadyFulfilled) {
    try {
      const token = await createMagicLink({
        email: email.trim().toLowerCase(),
        tier: GAMEPLAN_TIER,
        orderId: session.id,
      });
      const appUrl = process.env.APP_URL;
      if (!appUrl) throw new Error("APP_URL is not configured");
      const link = `${appUrl}/api/access/redeem?token=${encodeURIComponent(token)}`;
      await sendMagicLinkEmail({
        to: email,
        link,
        tier: GAMEPLAN_TIER,
        orderId: session.id,
        source: "stripe",
      });
      await redis.set(fulfilmentKey, "1");
    } catch (error) {
      // A mail provider outage must not block immediate access after a paid order.
      // Leaving the fulfilment marker unset allows Stripe's webhook retry to try again.
      console.error("Backup access email failed:", error.message);
    }
  }

  return { email: email.trim().toLowerCase(), tier: GAMEPLAN_TIER };
}
