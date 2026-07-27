import { grantTier } from "../../lib/entitlements.js";
import { sendMagicLinkEmail } from "../../lib/mailer.js";
import { createMagicLink } from "../../lib/tokens.js";

function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body !== "string") return null;

  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("application/json")) {
    try { return JSON.parse(req.body); } catch { return null; }
  }

  return Object.fromEntries(new URLSearchParams(req.body));
}

function value(body, ...paths) {
  for (const path of paths) {
    const parts = path.split(".");
    let current = body;
    for (const part of parts) current = current?.[part];
    if (current !== undefined && current !== null && current !== "") return String(current);
  }
  return undefined;
}

function tierForProduct(productId) {
  if (productId === process.env.THRIVECART_PRODUCT_GAMEPLAN) return "gameplan";
  if (productId === process.env.THRIVECART_PRODUCT_DIY) return "diy";
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = parseBody(req);
  if (!body) return res.status(400).json({ error: "Invalid body" });

  const receivedSecret = value(body, "thrivecart_secret", "secret");
  if (!process.env.THRIVECART_SECRET || receivedSecret !== process.env.THRIVECART_SECRET) {
    return res.status(401).json({ error: "Invalid secret" });
  }

  const event = value(body, "event");
  if (event !== "order.success") return res.status(200).json({ ok: true, ignored: event || "unknown" });

  const email = value(body, "customer.email", "customer[email]", "customer_email", "email");
  const orderId = value(body, "order_id", "order.id");
  const productId = value(body, "base_product", "product_id", "product.id");
  if (!email || !orderId || !productId) {
    return res.status(400).json({ error: "Missing expected order fields" });
  }

  const tier = tierForProduct(productId);
  if (!tier) return res.status(400).json({ error: `Unrecognised product id: ${productId}` });
  if (!process.env.APP_URL) return res.status(500).json({ error: "APP_URL is not configured" });

  try {
    await grantTier(email, tier);
    const token = await createMagicLink({ email: email.trim().toLowerCase(), tier, orderId });
    const link = `${process.env.APP_URL}/api/access/redeem?token=${encodeURIComponent(token)}`;
    await sendMagicLinkEmail({ to: email, link, tier, orderId });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("ThriveCart webhook failed:", error.message);
    return res.status(500).json({ error: "Could not grant access" });
  }
}
