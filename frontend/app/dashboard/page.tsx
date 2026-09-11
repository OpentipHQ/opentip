"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/motion/button";
import { Input } from "@/components/motion/input";
import { Loader } from "@/components/motion/loader";
import { useAccount, useReadContracts } from "wagmi";
import { getContractAddress, opentipAbi } from "@/lib/contract";
import { Search } from "lucide-react";

function truncate(addr: string) { return addr.slice(0, 6) + "..." + addr.slice(-4); }

const PAGE_SIZE = 20;

export default function Dashboard() {
  const { data: session, status } = useSession();
  const { address } = useAccount();
  const contract = getContractAddress();
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState<any[]>([]);
  const [registeredRepos, setRegisteredRepos] = useState<any[]>([]);
  const [loadingRegistered, setLoadingRegistered] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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
    fetch("/api/github/repos?per_page=100").then(r => r.json()).then(j => Array.isArray(j) ? setRepos(j) : setRepos([])).finally(() => setLoading(false));
    fetch("/api/wallet/link").then(r => r.json()).then(j => Array.isArray(j) ? setWallets(j) : setWallets([])).catch(() => {});
    fetch("/api/registered-repos").then(r => r.json()).then(j => Array.isArray(j) ? setRegisteredRepos(j) : setRegisteredRepos([])).finally(() => setLoadingRegistered(false));
  }, [status]);

  const filtered = useMemo(() => {
    if (!search) return repos;
    const q = search.toLowerCase();
    return repos.filter(r => r.full_name.toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q));
  }, [repos, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);

  if (status === "loading") return <div className="py-20 flex justify-center"><Loader variant="spinner" size={24} /></div>;

  if (status === "unauthenticated") return (
    <div className="min-h-[60vh] flex flex-col justify-center">
      <div className="max-w-sm w-full mx-auto space-y-6">
        <h1 className="serif text-4xl md:text-5xl font-semibold tracking-tight leading-[0.9]">Dashboard</h1>
        <p className="text-sm text-zinc-600">Sign in to manage your repos and claim tips.</p>
        <Link href="/signin"><Button size="lg" className="px-8">Sign in</Button></Link>
      </div>
    </div>
  );

  const login = (session?.user as any)?.login || session?.user?.name || session?.user?.email;

  return (
    <div className="space-y-0">
      <section className="py-12 md:py-16 border-b rule space-y-4">
        <h1 className="serif text-4xl md:text-5xl font-semibold tracking-tight">{login}</h1>
        {wallets.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {wallets.map((w: any) => (
              <span key={w.address} className="stats text-xs text-zinc-600 border rule rounded-sm px-2 py-1">{truncate(w.address)}</span>
            ))}
          </div>
        )}
      </section>

      {registeredRepos.length > 0 && (
        <section className="py-10 border-b rule">
          <h2 className="serif text-lg font-semibold mb-4">Registered repos</h2>
          <ul className="divide-y rule">
            {registeredRepos.map((r: any) => {
              const onChain = onChainMap[r.repo_id];
              const pending = onChain ? (Number(onChain.pending) / 1e6).toFixed(2) : "—";
              const total = onChain ? (Number(onChain.total) / 1e6).toFixed(2) : "—";
              const isClaimant = address && contract && r.payout_address.toLowerCase() === address.toLowerCase();
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
                    {isClaimant && (
                      <Link href={`/${r.repo_id}`}><Button size="sm" variant="secondary">Claim</Button></Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="py-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="serif text-lg font-semibold">GitHub repos</h2>
          {!loading && repos.length > 0 && (
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search repos..." className="h-9 w-full bg-transparent border rule rounded-sm pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus:border-accent" />
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-12 flex justify-center"><Loader variant="dots" size={20} /></div>
        ) : repos.length === 0 ? (
          <p className="text-sm text-zinc-500 mt-3">No repos found.</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-zinc-500 mt-3">No repos match &ldquo;{search}&rdquo;</p>
        ) : (
          <>
            <ul className="mt-4 divide-y rule">
              {paged.map((r: any) => (
                <li key={r.full_name} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <img src={r.avatar_url} alt={r.owner} width={32} height={32} className="rounded-sm" />
                    <div>
                      <div className="font-mono text-sm">{r.full_name}</div>
                      {r.description && <div className="text-xs text-zinc-500 truncate max-w-[40ch]">{r.description}</div>}
                    </div>
                  </div>
                  <Link href={`/${r.full_name}`} className="text-sm underline underline-offset-4 text-zinc-700">View</Link>
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t rule">
                <span className="text-xs text-zinc-500">{filtered.length} repos · page {currentPage} of {totalPages}</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" disabled={currentPage <= 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
                  <Button variant="ghost" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</Button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {address && contract && (
        <section className="py-8 border-t rule">
          <span className="stats text-xs text-zinc-500 border rule rounded-sm px-2 py-1">{truncate(address)}</span>
          <span className="text-xs text-zinc-500 ml-3">check repo pages for pending and Claim.</span>
        </section>
      )}
    </div>
  );
}
