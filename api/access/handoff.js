import { getTier, hasAccess } from "../../lib/entitlements.js";
import { getRequestSession } from "../../lib/session.js";
import { createMagicLink } from "../../lib/tokens.js";

function redirect(res, destination) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Location", destination);
  return res.status(302).end();
}

export function createHandoffHandler(dependencies) {
  const {
    getSession,
    findTier,
    tierHasAccess,
    createLink,
    appUrl: configuredAppUrl,
  } = dependencies;

  return async function handler(req, res) {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const appUrl = configuredAppUrl();
    if (!appUrl) return res.status(500).json({ error: "APP_URL is not configured" });

    try {
      const session = await getSession(req);
      if (!session) return redirect(res, appUrl);

      const tier = await findTier(session.email);
      if (!tierHasAccess(tier, "gameplan")) return redirect(res, `${appUrl}/?access=revoked`);

      const token = await createLink({
        email: session.email,
        tier,
        source: "legacy-domain-handoff",
      });
      return redirect(res, `${appUrl}/api/access/redeem?token=${encodeURIComponent(token)}`);
    } catch (error) {
      console.error("Legacy-domain handoff failed:", error.message);
      return redirect(res, `${appUrl}/?access=error`);
    }
  };
}

export default createHandoffHandler({
  getSession: getRequestSession,
  findTier: getTier,
  tierHasAccess: hasAccess,
  createLink: createMagicLink,
  appUrl: () => process.env.APP_URL,
});
