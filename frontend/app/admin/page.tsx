"use client";
import { useEffect, useState } from "react";
import { Loader } from "@/components/motion/loader";
import { getTokenSymbol, getTokenDecimals, ETH_ADDRESS, USDC_ADDRESS, OAR_ADDRESS } from "@/lib/chain";
import { fmtUsd } from "@/lib/prices";

interface Stats {
  totalTipsAmount: string;
  totalFeesAmount: string;
  totalTipCount: number;
  totalRepos: number;
  totalUsers: number;
  tokenTotals: { token: string; total: string; fees: string }[];
  treasuryBalances: Record<string, string>;
  recentTips: any[];
}

function formatAmount(raw: number | string, token?: string): string {
  const num = typeof raw === "string" ? Number(raw) : raw;
  const decimals = getTokenDecimals(token);
  const val = num / Math.pow(10, decimals);
  return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function truncate(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
    fetch("/api/prices").then((r) => r.json()).then(setPrices).catch(() => {});
  }, []);

  if (loading) return <div className="py-20 flex justify-center"><Loader variant="spinner" size={24} /></div>;
  if (!stats || (stats as any).error || !Array.isArray(stats.recentTips)) return <div className="py-20 text-sm text-zinc-600">Failed to load stats</div>;

  return (
    <div className="space-y-8">
      <h1 className="serif text-2xl font-semibold">Overview</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total tips" value={String(stats.totalTipCount)} />
        <StatCard label="Registered repos" value={String(stats.totalRepos)} />
        <StatCard label="Users" value={String(stats.totalUsers)} />
        {(() => {
          const totalUsd = stats.tokenTotals.reduce((sum, t) => {
            const decimals = getTokenDecimals(t.token);
            const amount = Number(t.total || 0) / Math.pow(10, decimals);
            const price = prices[t.token?.toLowerCase()] ?? 0;
            return sum + amount * price;
          }, 0);
          return <StatCard label="Volume (USD)" value={fmtUsd(totalUsd)} />;
        })()}
        {[ETH_ADDRESS, USDC_ADDRESS, OAR_ADDRESS].map((addr) => {
          const t = stats.tokenTotals.find((x) => x.token.toLowerCase() === addr.toLowerCase());
          const price = prices[addr.toLowerCase()] ?? 0;
          const symbol = getTokenSymbol(addr);
          return (
            <StatCard key={addr} label={`${symbol} tipped`} value={t ? formatAmount(t.total, t.token) : "0"} sub={price > 0 ? `$${price.toLocaleString(undefined, { maximumFractionDigits: 6 })}/${symbol}` : undefined} />
          );
        })}
      </div>

      {/* Token breakdown */}
      {stats.tokenTotals.length > 0 && (
        <div>
          <h2 className="serif text-lg font-semibold mb-4">Volume by token</h2>
          <div className="border rule rounded-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b rule bg-zinc-900/5">
                  <th className="text-left px-4 py-2 font-medium text-zinc-600">Token</th>
                  <th className="text-right px-4 py-2 font-medium text-zinc-600">Total Tipped</th>
                  <th className="text-right px-4 py-2 font-medium text-zinc-600">Fees</th>
                  <th className="text-right px-4 py-2 font-medium text-zinc-600">USD Value</th>
                </tr>
              </thead>
              <tbody>
                {stats.tokenTotals
                  .filter((t) => [ETH_ADDRESS, USDC_ADDRESS, OAR_ADDRESS].some((a) => a.toLowerCase() === t.token.toLowerCase()))
                  .map((t) => {
                    const decimals = getTokenDecimals(t.token);
                    const amount = Number(t.total || 0) / Math.pow(10, decimals);
                    const price = prices[t.token?.toLowerCase()] ?? 0;
                    return (
                      <tr key={t.token} className="border-b rule last:border-0">
                        <td className="px-4 py-2 text-xs font-medium">{getTokenSymbol(t.token)}</td>
                        <td className="px-4 py-2 text-right stats text-xs">{formatAmount(t.total, t.token)} {getTokenSymbol(t.token)}</td>
                        <td className="px-4 py-2 text-right stats text-xs text-zinc-500">{formatAmount(t.fees, t.token)} {getTokenSymbol(t.token)}</td>
                        <td className="px-4 py-2 text-right stats text-xs">{fmtUsd(amount * price)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Treasury balances */}
      {Object.keys(stats.treasuryBalances).length > 0 && (
        <div>
          <h2 className="serif text-lg font-semibold mb-4">Treasury balances</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Object.entries(stats.treasuryBalances).map(([addr, bal]) => {
              const symbol = getTokenSymbol(addr);
              const decimals = getTokenDecimals(addr);
              const formatted = Number(bal) / Math.pow(10, decimals);
              const price = prices[addr.toLowerCase()] ?? 0;
              const usd = formatted * price;
              return (
                <div key={addr} className="border rule rounded-sm p-4">
                  <div className="text-[0.65rem] uppercase tracking-[0.2em] text-zinc-500">{symbol}</div>
                  <div className="stats mt-2 text-xl text-zinc-900">{formatted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</div>
                  {price > 0 && <div className="text-[0.65rem] text-zinc-500 mt-1">{fmtUsd(usd)}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                  <th className="text-left px-4 py-2 font-medium text-zinc-600">Token</th>
                  <th className="text-right px-4 py-2 font-medium text-zinc-600">Fee</th>
                  <th className="text-right px-4 py-2 font-medium text-zinc-600">Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTips.map((tip, i) => (
                  <tr key={i} className="border-b rule last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">{truncate(tip.tipper_address)}</td>
                    <td className="px-4 py-2 font-mono text-xs">{tip.repo_id}</td>
                    <td className="px-4 py-2 text-right stats text-xs">{formatAmount(tip.amount, tip.token)}</td>
                    <td className="px-4 py-2 text-xs text-zinc-500">{getTokenSymbol(tip.token)}</td>
                    <td className="px-4 py-2 text-right stats text-xs text-zinc-500">{formatAmount(tip.fee_amount, tip.token)}</td>
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
      </div>
      {sub && <div className="text-[0.65rem] text-zinc-500 mt-1">{sub}</div>}
    </div>
  );
}
