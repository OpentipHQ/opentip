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

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.login?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.wallets.some((w: any) => w.address.toLowerCase().includes(q))
    );
  });

  if (loading) return <div className="py-20 flex justify-center"><Loader variant="spinner" size={24} /></div>;

  return (
    <div className="space-y-6">
      <h1 className="serif text-2xl font-semibold">Users</h1>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by login, email, or wallet..."
        className="w-full max-w-sm bg-transparent border rule rounded-sm px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus:border-accent"
      />

      <div className="border rule rounded-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b rule bg-zinc-900/5">
              <th className="text-left px-4 py-2 font-medium text-zinc-600">User</th>
              <th className="text-left px-4 py-2 font-medium text-zinc-600">Wallet(s)</th>
              <th className="text-right px-4 py-2 font-medium text-zinc-600">Tips sent</th>
              <th className="text-right px-4 py-2 font-medium text-zinc-600">Total tipped</th>
              <th className="text-right px-4 py-2 font-medium text-zinc-600">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-b rule last:border-0">
                <td className="px-4 py-2">
                  <div className="text-xs font-medium">{user.login || user.email || "—"}</div>
                </td>
                <td className="px-4 py-2">
                  {user.wallets.length === 0 ? (
                    <span className="text-xs text-zinc-500">No wallet</span>
                  ) : (
                    user.wallets.map((w: any) => (
                      <div key={w.address} className="font-mono text-xs">{truncate(w.address)}</div>
                    ))
                  )}
                </td>
                <td className="px-4 py-2 text-right stats text-xs">{user.tipsReceived}</td>
                <td className="px-4 py-2 text-right stats text-xs">{formatUsdc(user.totalTipped)} USDC</td>
                <td className="px-4 py-2 text-right text-xs text-zinc-500">{new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
