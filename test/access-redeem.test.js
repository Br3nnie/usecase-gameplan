import assert from "node:assert/strict";
import test from "node:test";
import { createRedeemHandler } from "../api/access/redeem.js";

const VALID_TOKEN = "abcdefghijklmnopqrstuvwxyzABCDEF";

function response() {
  return {
    headers: {},
    statusCode: null,
    body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    send(body) { this.body = body; return this; },
    json(body) { this.body = body; return this; },
    end() { return this; },
  };
}

function setup({ record = { email: "buyer@example.com" }, tier = "gameplan" } = {}) {
  const calls = { find: 0, consume: 0 };
  const handler = createRedeemHandler({
    findLink: async () => { calls.find += 1; return record; },
    consumeLink: async () => { calls.consume += 1; return record; },
    findTier: async () => tier,
    tierHasAccess: value => value === "gameplan",
    createToken: async email => `session-for-${email}`,
    makeCookie: token => `ucgp_session=${token}; Secure`,
    appUrl: () => "https://usecase-gameplan.vercel.app",
  });
  return { handler, calls };
}

test("GET validates the link but does not consume it", async () => {
  const { handler, calls } = setup();
  const res = response();

  await handler({ method: "GET", query: { token: VALID_TOKEN } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(calls.find, 1);
  assert.equal(calls.consume, 0);
  assert.match(res.body, /method="post"/);
  assert.match(res.body, /action="https:\/\/usecase-gameplan\.vercel\.app\/api\/access\/redeem"/);
  assert.match(res.body, new RegExp(`value="${VALID_TOKEN}"`));
  assert.equal(res.headers["Cache-Control"], "no-store");
  assert.equal(res.headers["Referrer-Policy"], "no-referrer");
  assert.match(res.headers["Content-Security-Policy"], /form-action https:\/\/usecase-gameplan\.vercel\.app/);
});

test("POST consumes the link, sets the session cookie, and redirects", async () => {
  const { handler, calls } = setup();
  const res = response();

  await handler({ method: "POST", query: {}, body: { token: VALID_TOKEN } }, res);

  assert.equal(calls.find, 0);
  assert.equal(calls.consume, 1);
  assert.equal(res.statusCode, 302);
  assert.equal(res.headers.Location, "https://usecase-gameplan.vercel.app");
  assert.equal(res.headers["Set-Cookie"], "ucgp_session=session-for-buyer@example.com; Secure");
});

test("a consumed or invalid link redirects to the expired state", async () => {
  const { handler } = setup({ record: null });
  const res = response();

  await handler({ method: "POST", query: {}, body: `token=${VALID_TOKEN}` }, res);

  assert.equal(res.statusCode, 302);
  assert.equal(res.headers.Location, "https://usecase-gameplan.vercel.app/?access=expired");
  assert.equal(res.headers["Set-Cookie"], undefined);
});

test("GET rejects revoked access without consuming the link", async () => {
  const { handler, calls } = setup({ tier: null });
  const res = response();

  await handler({ method: "GET", query: { token: VALID_TOKEN } }, res);

  assert.equal(res.statusCode, 302);
  assert.equal(res.headers.Location, "https://usecase-gameplan.vercel.app/?access=revoked");
  assert.equal(calls.find, 1);
  assert.equal(calls.consume, 0);
});
