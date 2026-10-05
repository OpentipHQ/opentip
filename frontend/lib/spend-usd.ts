import { usdValue } from "./prices";

export type UsdTally = { usd: number; unpriced: boolean };

export function emptyTally(): UsdTally {
  return { usd: 0, unpriced: false };
}

// A token with no positive USD price must not be treated as a $0 spend.
// That would let it slip under the per-transaction and daily caps.
export function addPricedSpend(
  tally: UsdTally,
  raw: string,
  token: string | null,
  prices: Record<string, number>,
): UsdTally {
  if (!token) return tally;
  let amount: bigint;
  try {
    amount = BigInt(raw);
  } catch {
    return { usd: tally.usd, unpriced: true };
  }
  if (amount === 0n) return tally;
  const price = prices[token.toLowerCase()];
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
    return { usd: tally.usd, unpriced: true };
  }
  let usd: number;
  try {
    usd = usdValue(raw, token, prices);
  } catch {
    return { usd: tally.usd, unpriced: true };
  }
  if (!Number.isFinite(usd)) return { usd: tally.usd, unpriced: true };
  return { usd: tally.usd + usd, unpriced: tally.unpriced };
}
