"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/motion/button";
import { Loader } from "@/components/motion/loader";
import { Search } from "lucide-react";
import { capitalize } from "@/lib/chain";
import { fmtUsd } from "@/lib/prices";

const PAGE_SIZE = 20;

type RepoMeta = {
  full_name: string;
  description: string | null;
  stargazers_count: number;
  owner: { login: string; avatar_url: string };
};

export default function ReposDirectory() {
  const [repos, setRepos] = useState<any[]>([]);
  const [metaMap, setMetaMap] = useState<Record<string, RepoMeta>>({});
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"tipped" | "recent" | "tips">("tipped");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ sort, page: String(page), limit: String(PAGE_SIZE) });
    if (search) params.set("q", search);
    fetch(`/api/repos?${params}`)
      .then(r => r.json())
      .then(j => {
        const items = j.items || [];
        setRepos(items);
        setTotal(j.total || 0);
        setTotalPages(j.totalPages || 1);

        const toFetch = items.filter((r: any) => !metaMap[r.repo_id]);
        if (toFetch.length > 0) {
          Promise.all(
            toFetch.map((r: any) => {
              const [owner, repo] = r.repo_id.split("/");
              return fetch(`/api/github/meta?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`)
                .then(res => res.ok ? res.json() : null)
                .catch(() => null)
                .then((meta: RepoMeta | null) => {
                  if (meta) return [r.repo_id, meta] as const;
                  return null;
                });
            })
          ).then(results => {
            const newEntries = results.filter(Boolean) as [string, RepoMeta][];
            if (newEntries.length > 0) {
              setMetaMap(prev => {
                const next = { ...prev };
                for (const [id, meta] of newEntries) next[id] = meta;
                return next;
              });
            }
          });
        }
      })
      .catch(() => { setRepos([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [sort, page, search]);

  useEffect(() => { setPage(1); }, [search, sort]);

  return (
    <div>
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-4xl">Repos</h1>
        <p className="max-w-xl text-sm text-muted-foreground">Registered funding pages. {total > 0 ? `${total} and counting.` : ""}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search owner or repo"
              aria-label="Search repos"
              className="h-10 w-full rounded-[10px] border border-border bg-transparent pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-accent"
            />
          </div>
          <div className="flex gap-1">
            {(["tipped", "recent", "tips"] as const).map(s => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`rounded-full px-3 py-1.5 text-xs transition-colors ${sort === s ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
              >
                {s === "tipped" ? "Most funded" : s === "recent" ? "Recent" : "Most funds"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="py-6">

        {loading ? (
          <div className="py-12 flex justify-center"><Loader variant="dots" size={20} /></div>
        ) : repos.length === 0 ? (
          <div className="space-y-3 rounded-[10px] border border-dashed border-border px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">No repos registered yet.</p>
            <Link href="/onboarding" className="text-sm underline underline-offset-4 hover:text-brand">Be the first &rarr;</Link>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-border rounded-[10px] border border-border">
              {repos.map((r: any) => {
                const meta = metaMap[r.repo_id];
                const [owner] = r.repo_id.split("/");
                return (
                  <li key={r.repo_id}>
                    <Link href={`/${r.repo_id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/60">
                      {r.icon ? (
                        <Image src={r.icon} alt={capitalize(r.repo_id.split("/")[1])} width={36} height={36} className="size-9 flex-shrink-0 rounded-[8px]" />
                      ) : meta ? (
                        <Image src={meta.owner.avatar_url} alt={owner} width={36} height={36} className="size-9 flex-shrink-0 rounded-[8px]" />
                      ) : (
                        <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-[8px] border border-border font-display">{capitalize(r.repo_id.split("/")[1]).slice(0, 1)}</span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{capitalize(r.repo_id.split("/")[1])}</span>
                        {meta?.description ? <span className="block truncate text-xs text-muted-foreground">{meta.description}</span> : null}
                      </span>
                      <span className="hidden text-xs text-muted-foreground sm:inline">{r.tip_count} funds</span>
                      <span className="font-mono text-sm tabular-nums">{typeof r.tipped_usd === "number" ? fmtUsd(r.tipped_usd) : ""}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t rule">
                <span className="text-xs text-zinc-500">{total} repos · page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
                  <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</Button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
