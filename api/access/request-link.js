import { createHash } from "node:crypto";
import { getTier, hasAccess } from "../../lib/entitlements.js";
import { sendMagicLinkEmail } from "../../lib/mailer.js";
import { getRedis } from "../../lib/redis.js";
import { createMagicLink } from "../../lib/tokens.js";

const RESPONSE_MESSAGE = "If that email has Gameplan access, a fresh sign-in link is on its way.";
const EMAIL_THROTTLE_SECONDS = 60;
const IP_WINDOW_SECONDS = 10 * 60;
const IP_REQUEST_LIMIT = 5;

function requestEmail(req) {
  if (typeof req.body?.email === "string") return req.body.email;
  if (typeof req.body === "string") return new URLSearchParams(req.body).get("email") || "";
  return "";
}

function normaliseEmail(value) {
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254 ? email : "";
}

function requestIp(req) {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function createRequestLinkHandler(dependencies) {
  const {
    findTier,
    tierHasAccess,
    createLink,
    sendLink,
    getRedisClient,
    appUrl: configuredAppUrl,
  } = dependencies;

  return async function handler(req, res) {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    res.setHeader("Cache-Control", "no-store");
    const email = normaliseEmail(requestEmail(req));
    if (!email) return res.status(200).json({ ok: true, message: RESPONSE_MESSAGE });

    try {
      const redis = getRedisClient();
      const ipKey = `access-request:ip:${digest(requestIp(req))}`;
      const ipCount = await redis.incr(ipKey);
      if (ipCount === 1) await redis.expire(ipKey, IP_WINDOW_SECONDS);
      if (ipCount > IP_REQUEST_LIMIT) {
        return res.status(200).json({ ok: true, message: RESPONSE_MESSAGE });
      }

      const emailKey = `access-request:email:${digest(email)}`;
      const allowed = await redis.set(emailKey, "1", { nx: true, ex: EMAIL_THROTTLE_SECONDS });
      if (!allowed) return res.status(200).json({ ok: true, message: RESPONSE_MESSAGE });

      const tier = await findTier(email);
      if (tierHasAccess(tier, "gameplan")) {
        const token = await createLink({
          email,
          tier,
          source: "return-access",
        });
        const appUrl = configuredAppUrl();
        if (!appUrl) throw new Error("APP_URL is not configured");
        await sendLink({
          to: email,
          link: `${appUrl}/api/access/redeem?token=${encodeURIComponent(token)}`,
          tier,
          orderId: digest(`${email}:${Date.now()}`).slice(0, 24),
          source: "return-access",
        });
      }
    } catch (error) {
      console.error("Access-link request failed:", error.message);
    }

    return res.status(200).json({ ok: true, message: RESPONSE_MESSAGE });
  };
}

export default createRequestLinkHandler({
  findTier: getTier,
  tierHasAccess: hasAccess,
  createLink: createMagicLink,
  sendLink: sendMagicLinkEmail,
  getRedisClient: getRedis,
  appUrl: () => process.env.APP_URL,
});
