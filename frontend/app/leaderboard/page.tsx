import { prisma } from "@/lib/prisma";
import { getTokenPrices, fmtUsd, usdValue } from "@/lib/prices";
import { rankTippersByUsd, type TipAggregateRow } from "@/lib/leaderboard-rank";

async function getLeaderboard() {
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

    return ranked.map((r) => ({
      tipper_address: r.tipper_address,
      display_name: nameMap.get(r.tipper_address.toLowerCase()) || null,
      usd: r.usd,
    }));
  } catch {
    return [];
  }
}

export default async function LeaderboardPage() {
  const rows: any[] = await getLeaderboard();
  return (
    <div className="space-y-0">
      <section className="py-12 md:py-16 border-b rule">
        <h1 className="serif fluid-page-title font-semibold tracking-tight">Top supporters</h1>
      </section>

      <section className="py-6">
        {rows.length === 0 ? (
          <p className="text-sm text-zinc-500 py-12 text-center">No tips yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
            <thead>
              <tr className="text-[0.65rem] uppercase tracking-[0.2em] text-zinc-500 text-left border-b rule">
                <th className="pb-3 font-medium">Supporter</th>
                <th className="pb-3 text-right font-medium">Total USD</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any, i: number) => (
                <tr key={`${r.tipper_address}-${i}`} className="border-b rule last:border-0">
                  <td className="py-4 font-mono text-zinc-700">{r.display_name || `${r.tipper_address.slice(0,6)}...${r.tipper_address.slice(-4)}`}</td>
                  <td className="py-4 text-right stats font-medium">{fmtUsd(r.usd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>
        )}
      </section>
    </div>
  );
}
