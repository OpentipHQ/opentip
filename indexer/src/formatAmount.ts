import { formatUnits } from "viem";

// Standalone copy of the amount formatter (indexer has no lib/chain).
// Amounts arrive in base units — never interpolate them raw into copy.
const USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const ZERO = "0x0000000000000000000000000000000000000000";

function tokenMeta(tokenLower: string): { symbol: string; decimals: number } {
  if (tokenLower === USDC) return { symbol: "USDC", decimals: 6 };
  if (tokenLower === ZERO) return { symbol: "ETH", decimals: 18 };
  return { symbol: "TOKEN", decimals: 18 };
}

export function hasAmount(raw: string | null | undefined): boolean {
  if (!raw) return false;
  try {
    return BigInt(raw) > 0n;
  } catch {
    return false;
  }
}

export function formatTokenAmount(
  raw: string | null | undefined,
  token: string | null | undefined,
): string | null {
  if (!hasAmount(raw)) return null;
  const meta = tokenMeta((token || "").toLowerCase());
  let v: string;
  try {
    v = formatUnits(BigInt(raw as string), meta.decimals);
  } catch {
    return null;
  }
  if (v.includes(".")) {
    const [i, f] = v.split(".");
    const cut = f.slice(0, 6).replace(/0+$/, "");
    v = cut ? `${i}.${cut}` : i;
  }
  return `${v} ${meta.symbol}`;
}
