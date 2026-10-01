"use client";
import { useState, useEffect } from "react";
import { Loader } from "@/components/motion/loader";

type Totals = { txs: number; usd: number };
type Data = {
  totals: { day: Totals; week: Totals; month: Totals };
  perDay: { date: string; txs: number; usd: number }[];
  topUsers: { label: string; txs: number; usd: number }[];
  circuitHealthy: boolean;
  recent: { id: string; createdAt: string; user: string; kind: string; status: string; txHash: string | null; gasUsd: number }[];
};

const fmtUsd = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Stat({ label, v }: { label: string; v: Totals }) {
  return (
    <div className="border rule rounded-sm p-4">
      <div className="text-[0.65rem] uppercase tracking-[0.2em] text-zinc-500">{label}</div>
      <div className="stats text-2xl font-semibold mt-1">{fmtUsd(v.usd)}</div>
      <div className="text-xs text-zinc-500 mt-1">{v.txs} sponsored txs</div>
    </div>
  );
}

export default function AdminSponsorship() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/sponsorship")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 flex justify-center"><Loader variant="spinner" size={24} /></div>;
  if (!data) return <div className="py-20 text-center text-sm text-zinc-500">Failed to load sponsorship data.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="serif text-2xl font-semibold">Sponsorship</h1>
        <span className={`text-[0.65rem] px-1.5 py-0.5 rounded ${data.circuitHealthy ? "bg-emerald-700 text-white" : "bg-red-700 text-white"}`}>
          {data.circuitHealthy ? "PAYMASTER HEALTHY" : "PAYMASTER DOWN"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Last 24h" v={data.totals.day} />
        <Stat label="Last 7 days" v={data.totals.week} />
        <Stat label="Last 30 days" v={data.totals.month} />
      </div>

      <div className="border rule rounded-sm overflow-x-auto">
        <div className="px-4 py-2 text-xs font-medium text-zinc-600 border-b rule">Daily spend</div>
        <table className="w-full text-sm">
          <tbody>
            {data.perDay.map((d) => (
              <tr key={d.date} className="border-b rule last:border-0">
                <td className="px-4 py-2 stats text-xs">{d.date}</td>
                <td className="px-4 py-2 text-right stats text-xs">{d.txs} txs</td>
                <td className="px-4 py-2 text-right stats text-xs">{fmtUsd(d.usd)}</td>
              </tr>
            ))}
            {data.perDay.length === 0 && (
              <tr><td className="px-4 py-3 text-xs text-zinc-500">No sponsored transactions yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border rule rounded-sm overflow-x-auto">
        <div className="px-4 py-2 text-xs font-medium text-zinc-600 border-b rule">Top users by spend</div>
        <table className="w-full text-sm">
          <tbody>
            {data.topUsers.map((u) => (
              <tr key={u.label} className="border-b rule last:border-0">
                <td className="px-4 py-2 text-xs font-medium">{u.label}</td>
                <td className="px-4 py-2 text-right stats text-xs">{u.txs} txs</td>
                <td className="px-4 py-2 text-right stats text-xs">{fmtUsd(u.usd)}</td>
              </tr>
            ))}
            {data.topUsers.length === 0 && (
              <tr><td className="px-4 py-3 text-xs text-zinc-500">No data yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border rule rounded-sm overflow-x-auto">
        <div className="px-4 py-2 text-xs font-medium text-zinc-600 border-b rule">Recent sponsored transactions</div>
        <table className="w-full text-sm">
          <tbody>
            {data.recent.map((r) => (
              <tr key={r.id} className="border-b rule last:border-0">
                <td className="px-4 py-2 text-xs text-zinc-500 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2 text-xs font-medium">{r.user}</td>
                <td className="px-4 py-2 text-xs text-zinc-500">{r.kind} · {r.status}</td>
                <td className="px-4 py-2 text-right stats text-xs">{fmtUsd(r.gasUsd)}</td>
              </tr>
            ))}
            {data.recent.length === 0 && (
              <tr><td className="px-4 py-3 text-xs text-zinc-500">No transactions yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
