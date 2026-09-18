import { prisma } from "@/lib/prisma";
import { getTokenPrices, usdValue, fmtUsd } from "@/lib/prices";

async function getLeaderboard() {
  try {
    const [rows, prices] = await Promise.all([
      prisma.$queryRaw`
        SELECT tipper_address, SUM(amount)::text as total, token
        FROM "Tip"
        GROUP BY tipper_address, token ORDER BY SUM(amount) DESC LIMIT 50
      `,
      getTokenPrices(),
    ]);

    const addrs = [...new Set((rows as any[]).map((r: any) => r.tipper_address))];
    const names = addrs.length
      ? await prisma.displayName.findMany({ where: { tipper_address: { in: addrs } } })
      : [];
    const nameMap = new Map(names.map((n) => [n.tipper_address.toLowerCase(), n.display_name]));

    const merged = new Map<string, { display_name: string|null; tipper_address: string; usd: number }>();
    for (const r of rows as any[]) {
      const key = r.tipper_address.toLowerCase();
      if (!merged.has(key)) merged.set(key, { display_name: nameMap.get(key) || null, tipper_address: r.tipper_address, usd: 0 });
      merged.get(key)!.usd += usdValue(r.total, r.token, prices);
    }
    return [...merged.values()]
      .sort((a, b) => b.usd - a.usd)
      .slice(0, 20);
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
