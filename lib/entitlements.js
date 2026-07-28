import { getRedis } from "./redis.js";

const TIER_RANK = { gameplan: 1, diy: 2 };

function normaliseEmail(email) {
  return email.trim().toLowerCase();
}

function entitlementKey(email) {
  return `entitlement:${normaliseEmail(email)}`;
}

export function isTier(value) {
  return value === "gameplan" || value === "diy";
}

export async function grantTier(email, tier) {
  if (!isTier(tier)) throw new Error("Invalid entitlement tier");
  const redis = getRedis();
  const current = await redis.get(entitlementKey(email));
  if (isTier(current) && TIER_RANK[current] >= TIER_RANK[tier]) return current;
  await redis.set(entitlementKey(email), tier);
  return tier;
}

export async function getTier(email) {
  const tier = await getRedis().get(entitlementKey(email));
  return isTier(tier) ? tier : null;
}

export function hasAccess(tier, required = "gameplan") {
  return isTier(tier) && TIER_RANK[tier] >= TIER_RANK[required];
}
