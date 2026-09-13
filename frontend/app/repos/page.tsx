"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/motion/button";
import { Loader } from "@/components/motion/loader";
import { Search } from "lucide-react";

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
    <div className="space-y-0">
      <section className="py-12 md:py-16 border-b rule space-y-4">
        <h1 className="serif text-4xl md:text-5xl font-semibold tracking-tight">Repos</h1>
        <p className="text-zinc-600 text-sm max-w-xs">Repos registered to receive tips. {total > 0 ? `${total} and counting.` : ""}</p>
      </section>

      <section className="py-10">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search repos..."
              className="h-9 w-full bg-transparent border rule rounded-sm pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus:border-accent"
            />
          </div>
          <div className="flex gap-1">
            {(["tipped", "recent", "tips"] as const).map(s => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-3 py-1.5 text-xs rounded-sm transition-colors ${sort === s ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-900/5"}`}
              >
                {s === "tipped" ? "Most tipped" : s === "recent" ? "Recent" : "Most tips"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center"><Loader variant="dots" size={20} /></div>
        ) : repos.length === 0 ? (
          <div className="py-12 space-y-3">
            <p className="text-sm text-zinc-500">No repos registered yet.</p>
            <Link href="/onboarding" className="text-sm underline underline-offset-4 hover:text-accent">Be the first &rarr;</Link>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {repos.map((r: any) => {
                const meta = metaMap[r.repo_id];
                const [owner] = r.repo_id.split("/");
                return (
                  <Link
                    key={r.repo_id}
                    href={`/${r.repo_id}`}
                    className="border rule rounded-sm p-5 hover:border-zinc-400 transition-colors group"
                  >
                    <div className="flex items-start gap-4">
                      {meta ? (
                        <Image src={meta.owner.avatar_url} alt={owner} width={40} height={40} className="rounded-sm flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-sm bg-zinc-200 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-sm font-medium group-hover:text-accent transition-colors truncate">{r.repo_id}</div>
                        {meta?.description && (
                          <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">{meta.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t rule">
                      <div className="flex gap-4">
                        <div>
                          <div className="stats text-sm font-medium">${(Number(r.total_tipped) / 1e6).toFixed(2)}</div>
                          <div className="text-[0.6rem] uppercase tracking-[0.15em] text-zinc-500 mt-0.5">tipped</div>
                        </div>
                        <div>
                          <div className="stats text-sm font-medium">{r.tip_count}</div>
                          <div className="text-[0.6rem] uppercase tracking-[0.15em] text-zinc-500 mt-0.5">tips</div>
                        </div>
                        {meta && (
                          <div>
                            <div className="stats text-sm font-medium">★ {meta.stargazers_count.toLocaleString()}</div>
                            <div className="text-[0.6rem] uppercase tracking-[0.15em] text-zinc-500 mt-0.5">stars</div>
                          </div>
                        )}
                      </div>
                      <span className="text-sm underline underline-offset-4 text-zinc-700 group-hover:text-accent">View</span>
                    </div>
                  </Link>
                );
              })}
            </div>

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
