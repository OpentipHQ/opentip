import { prisma } from "@/lib/prisma";

async function getLeaderboard() {
  try {
    const rows: any[] = await prisma.$queryRaw`
      SELECT tipper_address, SUM(usdc_amount)::text as total
      FROM "Tip"
      GROUP BY tipper_address ORDER BY SUM(usdc_amount) DESC LIMIT 20
    `;
    const addrs = rows.map((r: any) => r.tipper_address);
    const names = addrs.length
      ? await prisma.displayName.findMany({ where: { tipper_address: { in: addrs } } })
      : [];
    const nameMap = new Map(names.map((n) => [n.tipper_address.toLowerCase(), n.display_name]));
    return rows.map((r: any) => ({
      tipper_address: r.tipper_address,
      total: r.total,
      display_name: nameMap.get(r.tipper_address.toLowerCase()) || null,
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
                <th className="pb-3 text-right font-medium">Lifetime USDC</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.tipper_address} className="border-b rule last:border-0">
                  <td className="py-4 font-mono text-zinc-700">{r.display_name || `${r.tipper_address.slice(0,6)}...${r.tipper_address.slice(-4)}`}</td>
                  <td className="py-4 text-right stats font-medium">{(Number(r.total)/1e6).toFixed(2)}</td>
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
