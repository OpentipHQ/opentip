import { prisma } from "@/lib/prisma";
import { capitalize, getTokenDecimals, getTokenSymbol } from "@/lib/chain";
import { getTokenPrices, usdValue } from "@/lib/prices";

export type HomeLedgerTip = {
  id: string;
  name: string;
  amount: string;
  symbol: string;
  when: string;
};

export type HomeLedger = {
  repoId: string;
  project: string;
  fundedUsd: number;
  tips: HomeLedgerTip[];
};

function relTime(date: Date): string {
  const diff = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return date.toISOString().slice(0, 10);
}

function humanAmount(raw: string, decimals: number): string {
  const n = Number(raw) / Math.pow(10, decimals);
  if (!Number.isFinite(n)) return "0";
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (n >= 1) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

/** Real indexed funding for the landing card. Empty when nothing is recorded. */
export async function getHomeLedger(): Promise<HomeLedger | null> {
  try {
    const [grouped, prices, hidden] = await Promise.all([
      prisma.tip.groupBy({
        by: ["repo_id", "token"],
        _sum: { amount: true },
      }),
      getTokenPrices().catch(() => ({})),
      prisma.repo.findMany({ where: { hidden: true }, select: { repo_id: true } }),
    ]);
    const hiddenIds = new Set(hidden.map((row) => row.repo_id.toLowerCase()));
    const totals = new Map<string, number>();
    for (const row of grouped) {
      if (hiddenIds.has(row.repo_id.toLowerCase())) continue;
      const raw = row._sum.amount?.toString() ?? "0";
      const usd = usdValue(raw, row.token, prices);
      totals.set(row.repo_id, (totals.get(row.repo_id) ?? 0) + usd);
    }
    const top = [...totals.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    if (!top) return null;
    const [repoId, fundedUsd] = top;
    const recent = await prisma.tip.findMany({
      where: { repo_id: repoId },
      orderBy: { timestamp: "desc" },
      take: 4,
    });
    const addresses = [...new Set(recent.map((tip) => tip.tipper_address))];
    const names = addresses.length
      ? await prisma.displayName.findMany({ where: { tipper_address: { in: addresses } } })
      : [];
    const nameMap = new Map(names.map((row) => [row.tipper_address.toLowerCase(), row.display_name]));
    return {
      repoId,
      project: capitalize(repoId.split("/")[1] || repoId),
      fundedUsd,
      tips: recent.map((tip) => {
        const decimals = getTokenDecimals(tip.token);
        return {
          id: tip.id,
          name: nameMap.get(tip.tipper_address.toLowerCase()) || `${tip.tipper_address.slice(0, 6)}…${tip.tipper_address.slice(-4)}`,
          amount: humanAmount(tip.amount.toString(), decimals),
          symbol: getTokenSymbol(tip.token),
          when: relTime(tip.timestamp),
        };
      }),
    };
  } catch {
    return null;
  }
}

