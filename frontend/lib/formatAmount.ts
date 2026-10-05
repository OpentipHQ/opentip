import { formatUnits } from "viem";
import { getTokenDecimals, getTokenSymbol } from "./chain";

// Amounts are stored onchain in base units (wei, 6dp USDC, ...).
// These helpers turn them into human strings for notification copy.
export function hasAmount(raw: string | null | undefined): boolean {
  if (!raw) return false;
  try {
    return BigInt(raw) > 0n;
  } catch {
    return false;
  }
}

export function formatAmount(
  raw: string | null | undefined,
  token: string | null | undefined,
): string | null {
  if (!hasAmount(raw)) return null;
  let v: string;
  try {
    v = formatUnits(BigInt(raw as string), getTokenDecimals(token));
  } catch {
    return null;
  }
  if (v.includes(".")) {
    const [i, f] = v.split(".");
    const cut = f.slice(0, 6).replace(/0+$/, "");
    v = cut ? `${i}.${cut}` : i;
  }
  return v;
}

export function formatAmountWithSymbol(
  raw: string | null | undefined,
  token: string | null | undefined,
): string | null {
  const v = formatAmount(raw, token);
  return v === null ? null : `${v} ${getTokenSymbol(token)}`;
}

export function truncateAddress(a: string | null | undefined): string {
  if (!a) return "";
  return a.length > 13 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}
