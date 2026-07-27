import { getTier, hasAccess } from "../../lib/entitlements.js";
import { createSessionToken, sessionCookie } from "../../lib/session.js";
import { redeemMagicLink } from "../../lib/tokens.js";

function redirect(res, destination) {
  res.setHeader("Location", destination);
  return res.status(302).end();
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const appUrl = process.env.APP_URL;
  if (!appUrl) return res.status(500).json({ error: "APP_URL is not configured" });

  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!token) return redirect(res, `${appUrl}/?access=missing`);

  try {
    const record = await redeemMagicLink(token);
    if (!record) return redirect(res, `${appUrl}/?access=expired`);

    const tier = await getTier(record.email);
    if (!hasAccess(tier, "gameplan")) return redirect(res, `${appUrl}/?access=revoked`);

    const sessionToken = await createSessionToken(record.email);
    res.setHeader("Set-Cookie", sessionCookie(sessionToken));
    return redirect(res, appUrl);
  } catch (error) {
    console.error("Magic-link redemption failed:", error.message);
    return redirect(res, `${appUrl}/?access=error`);
  }
}
