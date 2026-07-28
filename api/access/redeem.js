import { getTier, hasAccess } from "../../lib/entitlements.js";
import { createSessionToken, sessionCookie } from "../../lib/session.js";
import { getMagicLink, redeemMagicLink } from "../../lib/tokens.js";

function redirect(res, destination) {
  res.setHeader("Location", destination);
  return res.status(302).end();
}

function requestToken(req) {
  if (typeof req.query?.token === "string") return req.query.token;
  if (typeof req.body?.token === "string") return req.body.token;
  if (typeof req.body === "string") return new URLSearchParams(req.body).get("token") || "";
  return "";
}

function confirmationPage(token, appUrl) {
  const redeemUrl = new URL("/api/access/redeem", appUrl).href;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Open your AI Use Case Gameplan — Corbelle</title>
    <style>
      :root { color-scheme: light; font-family: "DM Sans", Arial, sans-serif; color: #1a1a2e; background: #f0f4f8; }
      * { box-sizing: border-box; }
      body { min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 24px; }
      main { width: min(100%, 520px); padding: 36px 32px; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
      img { width: 140px; height: auto; margin-bottom: 22px; }
      h1 { margin: 0 0 12px; font-size: 24px; line-height: 1.3; }
      p { margin: 0; color: #4a5568; font-size: 14px; line-height: 1.65; }
      button { width: 100%; margin-top: 22px; padding: 14px 28px; border: 0; border-radius: 999px; background: #1a56db; color: #fff; font: 600 15px "DM Sans", Arial, sans-serif; cursor: pointer; }
    </style>
  </head>
  <body>
    <main>
      <img src="/corbelle-logo.png" alt="Corbelle">
      <h1>Open your AI Use Case Gameplan</h1>
      <p>Confirm below to sign this device in. Your secure link will only be used when you continue.</p>
      <form method="post" action="${redeemUrl}">
        <input type="hidden" name="token" value="${token}">
        <button type="submit">Continue to my Gameplan →</button>
      </form>
    </main>
  </body>
</html>`;
}

export function createRedeemHandler(dependencies) {
  const {
    findLink,
    consumeLink,
    findTier,
    tierHasAccess,
    createToken,
    makeCookie,
    appUrl: configuredAppUrl,
  } = dependencies;

  return async function handler(req, res) {
    if (req.method !== "GET" && req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const appUrl = configuredAppUrl();
    if (!appUrl) return res.status(500).json({ error: "APP_URL is not configured" });

    const token = requestToken(req);
    if (!token) return redirect(res, `${appUrl}/?access=missing`);

    try {
      if (req.method === "GET") {
        const record = await findLink(token);
        if (!record) return redirect(res, `${appUrl}/?access=expired`);

        const tier = await findTier(record.email);
        if (!tierHasAccess(tier, "gameplan")) return redirect(res, `${appUrl}/?access=revoked`);

        res.setHeader("Cache-Control", "no-store");
        const appOrigin = new URL(appUrl).origin;
        res.setHeader("Content-Security-Policy", `default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; form-action ${appOrigin}; base-uri 'none'; frame-ancestors 'none'`);
        res.setHeader("Referrer-Policy", "no-referrer");
        res.setHeader("X-Content-Type-Options", "nosniff");
        return res.status(200).send(confirmationPage(token, appUrl));
      }

      const record = await consumeLink(token);
      if (!record) return redirect(res, `${appUrl}/?access=expired`);

      const tier = await findTier(record.email);
      if (!tierHasAccess(tier, "gameplan")) return redirect(res, `${appUrl}/?access=revoked`);

      const sessionToken = await createToken(record.email);
      res.setHeader("Set-Cookie", makeCookie(sessionToken));
      return redirect(res, appUrl);
    } catch (error) {
      console.error("Magic-link redemption failed:", error.message);
      return redirect(res, `${appUrl}/?access=error`);
    }
  };
}

export default createRedeemHandler({
  findLink: getMagicLink,
  consumeLink: redeemMagicLink,
  findTier: getTier,
  tierHasAccess: hasAccess,
  createToken: createSessionToken,
  makeCookie: sessionCookie,
  appUrl: () => process.env.APP_URL,
});
