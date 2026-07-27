import { getTier, hasAccess } from "../../lib/entitlements.js";
import { getRequestSession } from "../../lib/session.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const session = await getRequestSession(req);
    if (!session) return res.status(200).json({ authenticated: false, access: false });

    const tier = await getTier(session.email);
    return res.status(200).json({
      authenticated: true,
      access: hasAccess(tier, "gameplan"),
      tier,
    });
  } catch (error) {
    console.error("Session check failed:", error.message);
    return res.status(500).json({ error: "Access check failed" });
  }
}
