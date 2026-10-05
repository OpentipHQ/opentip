import { usdValue } from "./prices";

export type TipAggregateRow = {
  tipper_address: string;
  total: string;
  token: string;
};

export type RankedTipper = {
  tipper_address: string;
  usd: number;
};

// Sum every token for a tipper, then sort by USD. Callers must not LIMIT
// the SQL by raw base units before this runs, or a high-USD tip in a
// small-decimal token gets cut.
export function rankTippersByUsd(
  rows: TipAggregateRow[],
  prices: Record<string, number>,
  limit: number,
): RankedTipper[] {
  const merged = new Map<string, RankedTipper>();
  for (const row of rows) {
    const key = row.tipper_address.toLowerCase();
    const current = merged.get(key) ?? { tipper_address: row.tipper_address, usd: 0 };
    current.usd += usdValue(row.total, row.token, prices);
    merged.set(key, current);
  }
  return [...merged.values()].sort((a, b) => b.usd - a.usd).slice(0, limit);
}

export function rowsForTopTippers<T extends TipAggregateRow>(
  rows: T[],
  prices: Record<string, number>,
  limit: number,
): T[] {
  const ranked = rankTippersByUsd(rows, prices, limit);
  const order = new Map(ranked.map((row, index) => [row.tipper_address.toLowerCase(), index]));
  return rows
    .filter((row) => order.has(row.tipper_address.toLowerCase()))
    .sort((a, b) => order.get(a.tipper_address.toLowerCase())! - order.get(b.tipper_address.toLowerCase())!);
}
