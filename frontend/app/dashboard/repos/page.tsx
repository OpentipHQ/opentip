"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/motion/button";
import { Loader } from "@/components/motion/loader";
import { useAccount, useReadContracts } from "wagmi";
import { getContractAddress, opentipAbi } from "@/lib/contract";

type LinkItem = { title: string; url: string };

function LinksEditor({ repoId, onClose }: { repoId: string; onClose: () => void }) {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [summaryStatus, setSummaryStatus] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/repos/links?repoId=${encodeURIComponent(repoId)}`).then(r => r.json()),
      fetch(`/api/repos/summary?repoId=${encodeURIComponent(repoId)}`).then(r => r.json()),
    ]).then(([linksRes, summaryRes]) => {
      setLinks(linksRes.links || []);
      if (summaryRes.cached) {
        setSummaryStatus("Summary cached");
      } else if (summaryRes.summary) {
        setSummaryStatus("Summary generated");
      } else {
        setSummaryStatus(null);
      }
    }).finally(() => setLoading(false));
  }, [repoId]);

  function addLink() {
    if (links.length >= 10) return;
    setLinks([...links, { title: "", url: "" }]);
  }

  function updateLink(index: number, field: "title" | "url", value: string) {
    const updated = [...links];
    updated[index] = { ...updated[index], [field]: value };
    setLinks(updated);
  }

  function removeLink(index: number) {
    setLinks(links.filter((_, i) => i !== index));
  }

  async function saveLinks() {
    setSaving(true);
    try {
      const res = await fetch("/api/repos/links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoId, links }),
      });
      if (res.ok) {
        const data = await res.json();
        setLinks(data.links || []);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="py-4"><Loader variant="dots" size={16} /></div>;

  return (
    <div className="mt-3 border-t rule pt-4 space-y-4">
      {/* Links */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Links</h4>
          <span className="text-xs text-zinc-400">{links.length}/10</span>
        </div>
        {links.length === 0 && (
          <p className="text-xs text-zinc-400">No links yet. Add documentation, social, or community links.</p>
        )}
        {links.map((link, i) => (
          <div key={i} className="flex gap-2 items-start">
            <input
              type="text"
              placeholder="Title"
              value={link.title}
              onChange={(e) => updateLink(i, "title", e.target.value)}
              className="w-32 px-2 py-1.5 bg-zinc-50 border rule rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-zinc-300"
            />
            <input
              type="url"
              placeholder="https://..."
              value={link.url}
              onChange={(e) => updateLink(i, "url", e.target.value)}
              className="flex-1 px-2 py-1.5 bg-zinc-50 border rule rounded-sm text-xs font-mono focus:outline-none focus:ring-1 focus:ring-zinc-300"
            />
            <button
              onClick={() => removeLink(i)}
              className="px-2 py-1.5 text-xs text-zinc-400 hover:text-red-500 transition-colors"
            >
              ✕
            </button>
          </div>
        ))}
        {links.length < 10 && (
          <button
            onClick={addLink}
            className="text-xs text-zinc-500 hover:text-accent transition-colors"
          >
            + Add link
          </button>
        )}
      </div>

      {/* Summary status */}
      <div className="flex items-center gap-3 border-t rule pt-3">
        <span className="text-xs text-zinc-500">
          {summaryStatus || "No summary generated yet"}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button size="sm" onClick={saveLinks} disabled={saving}>
          {saving ? "Saving..." : "Save links"}
        </Button>
        <Button size="sm" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

export default function DashboardRepos() {
  const { status } = useSession();
  const { address } = useAccount();
  const contract = getContractAddress();
  const [registeredRepos, setRegisteredRepos] = useState<any[]>([]);
  const [loadingRegistered, setLoadingRegistered] = useState(true);
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);

  const onChainContracts = contract && registeredRepos.length > 0 ? registeredRepos.flatMap((r: any) => [
    { address: contract, abi: opentipAbi, functionName: "getPendingBalance" as const, args: [r.repo_id] },
    { address: contract, abi: opentipAbi, functionName: "getTotalTipped" as const, args: [r.repo_id] },
  ]) : [];

  const { data: onChainData } = useReadContracts({ contracts: onChainContracts });

  const onChainMap = useMemo(() => {
    const map: Record<string, { pending: string; total: string }> = {};
    for (let i = 0; i < registeredRepos.length; i++) {
      const pendingResult = onChainData?.[i * 2];
      const totalResult = onChainData?.[i * 2 + 1];
      if (pendingResult?.status === "success" && totalResult?.status === "success") {
        map[registeredRepos[i].repo_id] = {
          pending: (pendingResult.result as bigint).toString(),
          total: (totalResult.result as bigint).toString(),
        };
      }
    }
    return map;
  }, [onChainData, registeredRepos]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/registered-repos").then(r => r.json()).then(j => Array.isArray(j) ? setRegisteredRepos(j) : setRegisteredRepos([])).finally(() => setLoadingRegistered(false));
  }, [status]);

  if (status === "loading") return <div className="py-20 flex justify-center"><Loader variant="spinner" size={24} /></div>;

  return (
    <div className="space-y-0">
      <h1 className="serif text-2xl font-semibold mb-6">Repos</h1>

      {loadingRegistered ? (
        <div className="py-12 flex justify-center"><Loader variant="dots" size={20} /></div>
      ) : registeredRepos.length === 0 ? (
        <p className="text-sm text-zinc-500">No registered repos yet. Visit a repo page to register.</p>
      ) : (
        <ul className="divide-y rule">
          {registeredRepos.map((r: any) => {
            const onChain = onChainMap[r.repo_id];
            const pending = onChain ? (Number(onChain.pending) / 1e6).toFixed(2) : "—";
            const total = onChain ? (Number(onChain.total) / 1e6).toFixed(2) : "—";
            const isClaimant = address && contract && r.payout_address.toLowerCase() === address.toLowerCase();
            const isExpanded = expandedRepo === r.repo_id;
            return (
              <li key={r.repo_id} className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Link href={`/${r.repo_id}`} className="font-mono text-sm underline underline-offset-4 hover:text-accent">{r.repo_id}</Link>
                    <div className="flex gap-4 mt-1">
                      <span className="stats text-xs text-zinc-500">pending: ${pending}</span>
                      <span className="stats text-xs text-zinc-500">total: ${total}</span>
                      <span className="stats text-xs text-zinc-500">{r.tip_count} tips</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setExpandedRepo(isExpanded ? null : r.repo_id)}
                    >
                      {isExpanded ? "Close" : "Manage"}
                    </Button>
                    {isClaimant && (
                      <Link href={`/${r.repo_id}`}><Button size="sm" variant="secondary">Claim</Button></Link>
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <LinksEditor
                    repoId={r.repo_id}
                    onClose={() => setExpandedRepo(null)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
