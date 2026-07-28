import assert from "node:assert/strict";
import test from "node:test";
import { createHandoffHandler } from "../api/access/handoff.js";

function response() {
  return {
    headers: {},
    statusCode: null,
    body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end() { return this; },
  };
}

function setup({ session = { email: "buyer@example.com" }, tier = "gameplan" } = {}) {
  const created = [];
  const handler = createHandoffHandler({
    getSession: async () => session,
    findTier: async () => tier,
    tierHasAccess: value => value === "gameplan",
    createLink: async payload => {
      created.push(payload);
      return "abcdefghijklmnopqrstuvwxyzABCDEF";
    },
    appUrl: () => "https://gameplan.corbelle.ai",
  });
  return { handler, created };
}

test("an existing legacy session receives a branded-domain handoff link", async () => {
  const { handler, created } = setup();
  const res = response();

  await handler({ method: "GET" }, res);

  assert.equal(res.statusCode, 302);
  assert.equal(
    res.headers.Location,
    "https://gameplan.corbelle.ai/api/access/redeem?token=abcdefghijklmnopqrstuvwxyzABCDEF",
  );
  assert.deepEqual(created, [{
    email: "buyer@example.com",
    tier: "gameplan",
    source: "legacy-domain-handoff",
  }]);
  assert.equal(res.headers["Cache-Control"], "no-store");
});

test("a visitor without a legacy session is sent to the branded app", async () => {
  const { handler, created } = setup({ session: null });
  const res = response();

  await handler({ method: "GET" }, res);

  assert.equal(res.statusCode, 302);
  assert.equal(res.headers.Location, "https://gameplan.corbelle.ai/?handoff=checked");
  assert.equal(created.length, 0);
});

test("a revoked legacy session is not handed off", async () => {
  const { handler, created } = setup({ tier: null });
  const res = response();

  await handler({ method: "GET" }, res);

  assert.equal(res.statusCode, 302);
  assert.equal(res.headers.Location, "https://gameplan.corbelle.ai/?access=revoked");
  assert.equal(created.length, 0);
});
