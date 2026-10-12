import { prisma } from "@/lib/prisma";
import { getTokenPrices, fmtUsd, usdValue } from "@/lib/prices";
import { rankTippersByUsd, type TipAggregateRow } from "@/lib/leaderboard-rank";

async function getLeaderboard(): Promise<{ rows: { tipper_address: string; display_name: string | null; usd: number }[]; error: boolean }> {
  try {
    const [rows, prices] = await Promise.all([
      prisma.$queryRaw<TipAggregateRow[]>`
        SELECT tipper_address, SUM(amount)::text as total, token
        FROM "Tip"
        GROUP BY tipper_address, token
      `,
      getTokenPrices(),
    ]);

    const ranked = rankTippersByUsd(rows, prices, 20, usdValue);
    const addrs = ranked.map((r) => r.tipper_address);
    const names = addrs.length
      ? await prisma.displayName.findMany({ where: { tipper_address: { in: addrs } } })
      : [];
    const nameMap = new Map(names.map((n) => [n.tipper_address.toLowerCase(), n.display_name]));

    return {
      error: false,
      rows: ranked.map((r) => ({
        tipper_address: r.tipper_address,
        display_name: nameMap.get(r.tipper_address.toLowerCase()) || null,
        usd: r.usd,
      })),
    };
  } catch {
    return { rows: [], error: true };
  }
}

export default async function LeaderboardPage() {
  const { rows, error } = await getLeaderboard();
  return (
    <div className="space-y-0">
      <header>
        <h1 className="font-display text-4xl">Leaderboard</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">Public totals. Ranks follow funded volume.</p>
      </header>

      <section className="py-6">
        {error ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Couldn&apos;t load the leaderboard. Try again in a minute.</p>
        ) : rows.length === 0 ? (
          <p className="rounded-[10px] border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">No funding yet.</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {rows.map((r, i) => (
              <li key={`${r.tipper_address}-${i}`} className="flex items-center gap-3 rounded-[10px] border border-border px-4 py-3">
                <span className="w-6 font-mono text-sm text-brand">{i + 1}</span>
                <span className="flex-1 font-mono text-sm">{r.display_name || `${r.tipper_address.slice(0,6)}...${r.tipper_address.slice(-4)}`}</span>
                <span className="font-mono text-sm tabular-nums">{fmtUsd(r.usd)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
