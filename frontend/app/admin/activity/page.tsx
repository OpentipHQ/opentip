"use client";
import { useState, useEffect } from "react";
import { Loader } from "@/components/motion/loader";

function formatUsdc(raw: number | string): string {
  const num = typeof raw === "string" ? Number(raw) / 1e6 : raw / 1e6;
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function truncate(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function AdminActivity() {
  const [tips, setTips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/tips?page=${page}&limit=50`)
      .then((r) => r.json())
      .then((j) => {
        setTips(j.tips || []);
        setTotalPages(j.pagination?.totalPages || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <div className="py-20 flex justify-center"><Loader variant="spinner" size={24} /></div>;

  return (
    <div className="space-y-6">
      <h1 className="serif text-2xl font-semibold">Activity</h1>

      <div className="border rule rounded-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b rule bg-zinc-900/5">
              <th className="text-left px-4 py-2 font-medium text-zinc-600">Tipper</th>
              <th className="text-left px-4 py-2 font-medium text-zinc-600">Repo</th>
              <th className="text-right px-4 py-2 font-medium text-zinc-600">Amount</th>
              <th className="text-right px-4 py-2 font-medium text-zinc-600">Fee</th>
              <th className="text-right px-4 py-2 font-medium text-zinc-600">Tx</th>
              <th className="text-right px-4 py-2 font-medium text-zinc-600">Time</th>
            </tr>
          </thead>
          <tbody>
            {tips.map((tip, i) => (
              <tr key={i} className="border-b rule last:border-0">
                <td className="px-4 py-2 font-mono text-xs">{truncate(tip.tipper_address)}</td>
                <td className="px-4 py-2 font-mono text-xs">{tip.repo_id}</td>
                <td className="px-4 py-2 text-right stats text-xs">{formatUsdc(tip.usdc_amount)} USDC</td>
                <td className="px-4 py-2 text-right stats text-xs text-zinc-500">{formatUsdc(tip.fee_amount)}</td>
                <td className="px-4 py-2 text-right">
                  <a
                    href={`https://sepolia.basescan.org/tx/${tip.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:underline font-mono"
                  >
                    {tip.tx_hash?.slice(0, 8)}...
                  </a>
                </td>
                <td className="px-4 py-2 text-right text-xs text-zinc-500">{new Date(tip.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-sm border rule rounded-sm disabled:opacity-40 hover:bg-zinc-900/5"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm text-zinc-600">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 text-sm border rule rounded-sm disabled:opacity-40 hover:bg-zinc-900/5"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
