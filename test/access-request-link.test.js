import assert from "node:assert/strict";
import test from "node:test";
import { createRequestLinkHandler } from "../api/access/request-link.js";

function response() {
  return {
    headers: {},
    statusCode: null,
    body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

function setup({ tier = "gameplan", allowEmail = true, ipCount = 1 } = {}) {
  const sent = [];
  const created = [];
  const redis = {
    incr: async () => ipCount,
    expire: async () => 1,
    set: async () => allowEmail ? "OK" : null,
  };
  const handler = createRequestLinkHandler({
    findTier: async () => tier,
    tierHasAccess: value => value === "gameplan",
    createLink: async payload => {
      created.push(payload);
      return "abcdefghijklmnopqrstuvwxyzABCDEF";
    },
    sendLink: async message => sent.push(message),
    getRedisClient: () => redis,
    appUrl: () => "https://gameplan.corbelle.ai",
  });
  return { handler, sent, created };
}

test("an entitled buyer receives a fresh branded access link", async () => {
  const { handler, sent, created } = setup();
  const res = response();

  await handler({
    method: "POST",
    body: { email: " Buyer@Example.com " },
    headers: { "x-forwarded-for": "203.0.113.10" },
  }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ok, true);
  assert.deepEqual(created, [{
    email: "buyer@example.com",
    tier: "gameplan",
    source: "return-access",
  }]);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "buyer@example.com");
  assert.equal(
    sent[0].link,
    "https://gameplan.corbelle.ai/api/access/redeem?token=abcdefghijklmnopqrstuvwxyzABCDEF",
  );
});

test("unknown and invalid emails receive the same neutral response", async () => {
  const unknown = setup({ tier: null });
  const invalid = setup();
  const unknownRes = response();
  const invalidRes = response();

  await unknown.handler({ method: "POST", body: { email: "nobody@example.com" }, headers: {} }, unknownRes);
  await invalid.handler({ method: "POST", body: { email: "not-an-email" }, headers: {} }, invalidRes);

  assert.deepEqual(unknownRes.body, invalidRes.body);
  assert.equal(unknown.sent.length, 0);
  assert.equal(invalid.sent.length, 0);
});

test("email and IP limits suppress sending without revealing the reason", async () => {
  const emailLimited = setup({ allowEmail: false });
  const ipLimited = setup({ ipCount: 6 });
  const emailRes = response();
  const ipRes = response();

  await emailLimited.handler({ method: "POST", body: { email: "buyer@example.com" }, headers: {} }, emailRes);
  await ipLimited.handler({ method: "POST", body: { email: "buyer@example.com" }, headers: {} }, ipRes);

  assert.deepEqual(emailRes.body, ipRes.body);
  assert.equal(emailLimited.sent.length, 0);
  assert.equal(ipLimited.sent.length, 0);
});
