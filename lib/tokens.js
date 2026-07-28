import { randomBytes } from "node:crypto";
import { getRedis } from "./redis.js";

const MAGIC_LINK_TTL_SECONDS = 60 * 60 * 24;

export function isMagicLinkToken(token) {
  return typeof token === "string" && /^[A-Za-z0-9_-]{32}$/.test(token);
}

export async function createMagicLink(payload) {
  const token = randomBytes(24).toString("base64url");
  await getRedis().set(`magic:${token}`, payload, { ex: MAGIC_LINK_TTL_SECONDS });
  return token;
}

export async function getMagicLink(token) {
  if (!isMagicLinkToken(token)) return null;
  return (await getRedis().get(`magic:${token}`)) ?? null;
}

export async function redeemMagicLink(token) {
  if (!isMagicLinkToken(token)) return null;
  return (await getRedis().getdel(`magic:${token}`)) ?? null;
}
