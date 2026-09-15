"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/motion/button";
import { Loader } from "@/components/motion/loader";
import { useToast } from "@/app/providers";

function formatUsdc(raw: number | string): string {
  const num = typeof raw === "string" ? Number(raw) / 1e6 : raw / 1e6;
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function truncate(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function AdminRepos() {
  const { showToast, dismissToast } = useToast();
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [reassignTarget, setReassignTarget] = useState<string | null>(null);
  const [newPayout, setNewPayout] = useState("");
  const [reassigning, setReassigning] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const handleToggleHidden = async (repoId: string, currentHidden: boolean) => {
    setToggling(repoId);
    try {
      const res = await fetch(`/api/admin/repos/${encodeURIComponent(repoId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: !currentHidden }),
      });
      const j = await res.json();
      if (j.ok) {
        setRepos(prev => prev.map(r => r.repoId === repoId ? { ...r, hidden: j.hidden } : r));
        showToast({ status: "success", title: j.hidden ? "Repo hidden" : "Repo visible" });
      } else {
        showToast({ status: "error", title: "Failed", description: j.error });
      }
    } catch (e: any) {
      showToast({ status: "error", title: "Failed", description: e.message });
    }
    setToggling(null);
  };

  useEffect(() => {
    fetch("/api/admin/repos")
      .then((r) => r.json())
      .then(setRepos)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = repos.filter((r) =>
    r.repoId.toLowerCase().includes(search.toLowerCase()) ||
    r.payoutAddress.toLowerCase().includes(search.toLowerCase())
  );

  const handleReassign = async () => {
    if (!reassignTarget || !newPayout) return;
    setReassigning(true);
    const toastId = showToast({ status: "loading", title: "Reassigning payout...", duration: 0 });
    try {
      const res = await fetch("/api/admin/reassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoId: reassignTarget, address: newPayout }),
      });
      const j = await res.json();
      dismissToast(toastId);
      if (j.ok) {
        showToast({ status: "success", title: "Payout reassigned" });
        setReassignTarget(null);
        setNewPayout("");
      } else {
        showToast({ status: "error", title: "Failed", description: j.error });
      }
    } catch (e: any) {
      dismissToast(toastId);
      showToast({ status: "error", title: "Failed", description: e.message });
    }
    setReassigning(false);
  };

  if (loading) return <div className="py-20 flex justify-center"><Loader variant="spinner" size={24} /></div>;

  return (
    <div className="space-y-6">
      <h1 className="serif text-2xl font-semibold">Registered repos</h1>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search repos or addresses..."
        className="w-full max-w-sm bg-transparent border rule rounded-sm px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus:border-accent"
      />

      <div className="border rule rounded-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b rule bg-zinc-900/5">
              <th className="text-left px-4 py-2 font-medium text-zinc-600">Repo</th>
              <th className="text-left px-4 py-2 font-medium text-zinc-600">Payout</th>
              <th className="text-right px-4 py-2 font-medium text-zinc-600">Balance</th>
              <th className="text-right px-4 py-2 font-medium text-zinc-600">Tips</th>
              <th className="text-center px-4 py-2 font-medium text-zinc-600">Hidden</th>
              <th className="text-right px-4 py-2 font-medium text-zinc-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((repo) => (
              <tr key={repo.repoId} className={`border-b rule last:border-0 ${repo.hidden ? "opacity-50" : ""}`}>
                <td className="px-4 py-2 font-mono text-xs">{repo.repoId}</td>
                <td className="px-4 py-2 font-mono text-xs">{truncate(repo.payoutAddress)}</td>
                <td className="px-4 py-2 text-right stats text-xs">{formatUsdc(repo.totalTipped)} USDC</td>
                <td className="px-4 py-2 text-right stats text-xs">{repo.tipCount}</td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => handleToggleHidden(repo.repoId, !!repo.hidden)}
                    disabled={toggling === repo.repoId}
                    className={`text-xs px-2 py-1 rounded-sm border rule transition-colors ${repo.hidden ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"}`}
                  >
                    {toggling === repo.repoId ? "..." : repo.hidden ? "Hidden" : "Visible"}
                  </button>
                </td>
                <td className="px-4 py-2 text-right">
                  <Button variant="ghost" size="sm" onClick={() => setReassignTarget(repo.repoId)}>
                    Reassign
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reassign modal */}
      {reassignTarget && (
        <div className="border rule rounded-sm p-4 space-y-3">
          <h2 className="text-sm font-medium">Reassign payout for {reassignTarget}</h2>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs text-zinc-500 mb-1">New payout address</label>
              <input
                type="text"
                value={newPayout}
                onChange={(e) => setNewPayout(e.target.value)}
                placeholder="0x..."
                className="w-full bg-transparent border rule rounded-sm px-3 py-1.5 text-sm text-zinc-900 font-mono placeholder:text-zinc-500 outline-none focus:border-accent"
              />
            </div>
            <Button onClick={handleReassign} disabled={reassigning || !newPayout}>
              {reassigning ? "Sending..." : "Confirm"}
            </Button>
            <Button variant="ghost" onClick={() => { setReassignTarget(null); setNewPayout(""); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
