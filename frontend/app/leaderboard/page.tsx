async function getLeaderboard() {
  const base = process.env.NEXTAUTH_URL || "";
  try {
    const res = await fetch(`${base}/api/leaderboard`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export default async function LeaderboardPage() {
  const rows: any[] = await getLeaderboard();
  return (
    <div className="space-y-0">
      <section className="py-12 md:py-16 border-b rule">
        <h1 className="serif text-4xl md:text-5xl font-semibold tracking-tight">Top supporters</h1>
      </section>

      <section className="py-6">
        {rows.length === 0 ? (
          <p className="text-sm text-zinc-500 py-12 text-center">No tips yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[0.65rem] uppercase tracking-[0.2em] text-zinc-500 text-left border-b rule">
                <th className="pb-3 font-medium">Supporter</th>
                <th className="pb-3 text-right font-medium">Lifetime USDC</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any, i: number) => (
                <tr key={r.tipper_address} className="border-b rule last:border-0">
                  <td className="py-4 font-mono text-zinc-700">{r.display_name || `${r.tipper_address.slice(0,6)}...${r.tipper_address.slice(-4)}`}</td>
                  <td className="py-4 text-right stats font-medium">{(Number(r.total)/1e6).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
