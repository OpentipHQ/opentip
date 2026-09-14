"use client";
import { useEffect, useState } from "react";
import { Loader } from "@/components/motion/loader";

interface Stats {
  totalTipsUsdc: string;
  totalFeesUsdc: string;
  treasuryBalance: string;
  totalTipCount: number;
  totalRepos: number;
  totalUsers: number;
  recentTips: any[];
}

function formatUsdc(raw: number | string): string {
  const num = typeof raw === "string" ? Number(raw) / 1e6 : raw / 1e6;
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function truncate(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 flex justify-center"><Loader variant="spinner" size={24} /></div>;
  if (!stats || (stats as any).error || !Array.isArray(stats.recentTips)) return <div className="py-20 text-sm text-zinc-600">Failed to load stats</div>;

  return (
    <div className="space-y-8">
      <h1 className="serif text-2xl font-semibold">Overview</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total tips" value={formatUsdc(stats.totalTipsUsdc)} sub="USDC" />
        <StatCard label="Platform fees" value={formatUsdc(stats.totalFeesUsdc)} sub="USDC" />
        <StatCard label="Treasury balance" value={formatUsdc(stats.treasuryBalance || "0")} sub="USDC" />
        <StatCard label="Registered repos" value={String(stats.totalRepos)} />
        <StatCard label="Users" value={String(stats.totalUsers)} />
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="serif text-lg font-semibold mb-4">Recent tips</h2>
        {stats.recentTips.length === 0 ? (
          <p className="text-sm text-zinc-500">No tips yet</p>
        ) : (
          <div className="border rule rounded-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b rule bg-zinc-900/5">
                  <th className="text-left px-4 py-2 font-medium text-zinc-600">Tipper</th>
                  <th className="text-left px-4 py-2 font-medium text-zinc-600">Repo</th>
                  <th className="text-right px-4 py-2 font-medium text-zinc-600">Amount</th>
                  <th className="text-right px-4 py-2 font-medium text-zinc-600">Fee</th>
                  <th className="text-right px-4 py-2 font-medium text-zinc-600">Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTips.map((tip, i) => (
                  <tr key={i} className="border-b rule last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">{truncate(tip.tipper_address)}</td>
                    <td className="px-4 py-2 font-mono text-xs">{tip.repo_id}</td>
                    <td className="px-4 py-2 text-right stats text-xs">{formatUsdc(tip.usdc_amount)} USDC</td>
                    <td className="px-4 py-2 text-right stats text-xs text-zinc-500">{formatUsdc(tip.fee_amount)}</td>
                    <td className="px-4 py-2 text-right text-xs text-zinc-500">{new Date(tip.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border rule rounded-sm p-4">
      <div className="text-[0.65rem] uppercase tracking-[0.2em] text-zinc-500">{label}</div>
      <div className="stats mt-2 text-2xl text-zinc-900">
        {value}
        {sub && <span className="text-xs text-zinc-500 font-sans ml-1">{sub}</span>}
      </div>
    </div>
  );
}
