"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/motion/button";
import { Loader } from "@/components/motion/loader";
import { useAccount, useReadContracts } from "wagmi";
import { getContractAddress, opentipAbi } from "@/lib/contract";

function truncate(addr: string) { return addr.slice(0, 6) + "..." + addr.slice(-4); }

export default function DashboardRepos() {
  const { data: session, status } = useSession();
  const { address } = useAccount();
  const contract = getContractAddress();
  const [registeredRepos, setRegisteredRepos] = useState<any[]>([]);
  const [loadingRegistered, setLoadingRegistered] = useState(true);

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
      )}
    </div>
  );
}
