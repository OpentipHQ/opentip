"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/motion/button";
import { Loader } from "@/components/motion/loader";
import { ExternalLink } from "lucide-react";
import { getBasescanTxUrl } from "@/lib/basescan";
import { getTokenSymbol, getTokenDecimals } from "@/lib/chain";

const PAGE_SIZE = 20;

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function truncate(addr: string) { return addr.slice(0, 6) + "..." + addr.slice(-4); }

export default function ActivityFeed() {
  const [tips, setTips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/tips?page=${page}&limit=${PAGE_SIZE}`)
      .then(r => r.json())
      .then(j => {
        setTips(Array.isArray(j) ? j : []);
        setHasMore(Array.isArray(j) && j.length === PAGE_SIZE);
      })
      .catch(() => { setTips([]); setHasMore(false); })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="space-y-0">
      <section className="py-12 md:py-16 border-b rule space-y-4">
        <h1 className="serif fluid-page-title font-semibold tracking-tight">Activity</h1>
        <p className="text-zinc-600 text-sm max-w-xs">Every tip, as it happens.</p>
      </section>

      <section className="py-10">
        {loading ? (
          <div className="py-12 flex justify-center"><Loader variant="dots" size={20} /></div>
        ) : tips.length === 0 ? (
          <div className="py-12 space-y-3">
            <p className="text-sm text-zinc-500">No tips yet.</p>
            <Link href="/repos" className="text-sm underline underline-offset-4 hover:text-accent">Send the first one &rarr;</Link>
          </div>
        ) : (
          <>
            <ul className="divide-y rule">
              {tips.map((t: any) => (
                <li key={t.id} className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/${t.repo_id}`} className="font-mono text-sm underline underline-offset-4 hover:text-accent">{t.repo_id}</Link>
                        <span className="text-xs text-zinc-500">received</span>
                        <span className="stats text-sm font-medium">{(Number(t.amount) / Math.pow(10, getTokenDecimals(t.token))).toFixed(2)} {getTokenSymbol(t.token)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <span>by {t.display_name || truncate(t.tipper_address)}</span>
                        <span>{timeAgo(t.timestamp)}</span>
                        <a href={getBasescanTxUrl(t.tx_hash)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-accent transition-colors">
                          tx <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                    <Link href={`/${t.repo_id}`} className="text-sm underline underline-offset-4 text-zinc-700 hover:text-accent">View</Link>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between mt-6 pt-4 border-t rule">
              <span className="text-xs text-zinc-500">Page {page}</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
                <Button variant="ghost" size="sm" disabled={!hasMore} onClick={() => setPage(p => p + 1)}>Next →</Button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
