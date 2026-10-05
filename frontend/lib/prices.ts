import { ETH_ADDRESS, USDC_ADDRESS, OAR_ADDRESS, getTokenDecimals } from "./chain";

const FALLBACK_PRICES: Record<string, number> = {
  [ETH_ADDRESS.toLowerCase()]: 0,
  [USDC_ADDRESS.toLowerCase()]: 1,
  [OAR_ADDRESS.toLowerCase()]: 0.000002,
};

let cache: { prices: Record<string, number>; ts: number } | null = null;
const CACHE_MS = 60_000;

export async function getTokenPrices(): Promise<Record<string, number>> {
  if (cache && Date.now() - cache.ts < CACHE_MS) return cache.prices;

  const prices: Record<string, number> = { ...FALLBACK_PRICES };

  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
      { next: { revalidate: 60 } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.ethereum?.usd) prices[ETH_ADDRESS.toLowerCase()] = data.ethereum.usd;
    }
  } catch {}

  try {
    const oarAddr = OAR_ADDRESS.toLowerCase();
    const res = await fetch(
      `https://api.coingecko.com/api/v3/onchain/simple/networks/base/token_price/${oarAddr}`,
      { next: { revalidate: 60 } }
    );
    if (res.ok) {
      const data = await res.json();
      const price = data?.data?.attributes?.token_prices?.[oarAddr];
      if (price) prices[oarAddr] = parseFloat(price);
    }
  } catch {}

  cache = { prices, ts: Date.now() };
  return prices;
}

export function usdValue(rawAmount: string, token: string, prices: Record<string, number>): number {
  const decimals = getTokenDecimals(token);
  const amount = Number(rawAmount) / Math.pow(10, decimals);
  const price = prices[token.toLowerCase()] ?? 0;
  return amount * price;
}

export function fmtUsd(value: number): string {
  if (value === 0) return "$0";
  if (value < 0.01) return `$${value.toFixed(6)}`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}
