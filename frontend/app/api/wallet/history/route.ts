import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CHAIN_ID, CONTRACT_ADDRESS, ETH_ADDRESS, getTokenSymbol, getTokenDecimals } from "@/lib/chain";

export const dynamic = "force-dynamic";

type HistItem = {
  hash: string;
  timestamp: string;
  direction: "in" | "out";
  kind: "tip" | "claim" | "register" | "transfer";
  token: string;
  symbol: string;
  decimals: number;
  amount: string;
  counterparty: string | null;
  repo_id: string | null;
  status?: string;
  isUserOp?: boolean;
};

// Short in-memory cache to respect free-tier rate limits
const cache = new Map<string, { ts: number; data: any }>();
const CACHE_MS = 30_000;

function isAddr(v: string | null | undefined): v is `0x${string}` {
  return !!v && /^0x[a-fA-F0-9]{40}$/.test(v);
}

// Alchemy Transfers API (free tier, 120 CU/call). Covers plain deposits
// (external) + token movements (erc20). NOTE: the `internal` category is NOT
// supported on Base — smart-wallet ETH legs come from our write-ahead log
// (WalletTx) instead, which captures 100% of in-app submits.
async function alchemyTransfers(dir: "in" | "out", address: string, rpcUrl: string) {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "alchemy_getAssetTransfers",
      params: [{
        fromBlock: "0x0",
        toBlock: "latest",
        ...(dir === "in" ? { toAddress: address } : { fromAddress: address }),
        category: ["external", "erc20"],
        order: "desc",
        withMetadata: true,
        maxCount: "0x19",
        excludeZeroValue: true,
      }],
    }),
  });
  if (!res.ok) throw new Error(`http ${res.status}`);
  const j = await res.json();
  if (j.error) throw new Error(String(j.error.message || "alchemy error").slice(0, 120));
  const transfers = j.result?.transfers;
  return Array.isArray(transfers) ? transfers : [];
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address")?.toLowerCase() || null;
  const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "25", 10)));
  if (!isAddr(address)) return NextResponse.json({ error: "valid address required" }, { status: 400 });

  const cacheKey = `${address}:${limit}:${CHAIN_ID}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_MS) return NextResponse.json(cached.data);

  const contract = (CONTRACT_ADDRESS || "").toLowerCase();
  const items: HistItem[] = [];
  const seen = new Set<string>();

  // 1) DB tips — sent by this wallet + received by repos it owns (has repo context)
  try {
    const sent = await prisma.tip.findMany({
      where: { tipper_address: address },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
    for (const t of sent) {
      seen.add(t.tx_hash.toLowerCase());
      items.push({
        hash: t.tx_hash,
        timestamp: t.timestamp.toISOString(),
        direction: "out",
        kind: "tip",
        token: t.token,
        symbol: getTokenSymbol(t.token),
        decimals: getTokenDecimals(t.token),
        amount: t.amount.toString(),
        counterparty: contract || null,
        repo_id: t.repo_id,
      });
    }
    const owned = await prisma.repo.findMany({
      where: { payout_address: address },
      select: { repo_id: true },
      take: 10,
    });
    if (owned.length > 0) {
      const received = await prisma.tip.findMany({
        where: { repo_id: { in: owned.map(r => r.repo_id) } },
        orderBy: { timestamp: "desc" },
        take: limit,
      });
      for (const t of received) {
        seen.add(t.tx_hash.toLowerCase());
        items.push({
          hash: t.tx_hash,
          timestamp: t.timestamp.toISOString(),
          direction: "in",
          kind: "tip",
          token: t.token,
          symbol: getTokenSymbol(t.token),
          decimals: getTokenDecimals(t.token),
          amount: t.amount.toString(),
          counterparty: t.tipper_address,
          repo_id: t.repo_id,
        });
      }
    }
    // DB claims — stored by the indexer, have repo context, survive keyless mode.
    // Isolated try/catch: if the Claim table isn't migrated yet, tips still render.
    try {
      const claims = await prisma.claim.findMany({
        where: { payout_address: address },
        orderBy: { timestamp: "desc" },
        take: limit,
      });
      for (const c of claims) {
        seen.add(c.tx_hash.toLowerCase());
        items.push({
          hash: c.tx_hash,
          timestamp: c.timestamp.toISOString(),
          direction: "in",
          kind: "claim",
          token: c.token,
          symbol: getTokenSymbol(c.token),
          decimals: getTokenDecimals(c.token),
          amount: c.amount.toString(),
          counterparty: contract || null,
          repo_id: c.repo_id,
        });
      }
    } catch (e) {
      console.error("wallet history claims failed (table may not be migrated yet)", e);
    }
  } catch (e) {
    console.error("wallet history db failed", e);
  }

  // 2) App write-ahead log — every in-app submit, instantly (incl. smart-wallet
  // ETH legs no free explorer can see). Pending rows carry the userOp hash.
  try {
    const logged = await prisma.walletTx.findMany({
      where: { wallet: address },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    for (const w of logged) {
      const hash = (w.tx_hash || w.user_op_hash || "") as string;
      const hashLower = hash.toLowerCase();
      if (hashLower && seen.has(hashLower)) continue;
      seen.add(hashLower);
      const isUserOpOnly = !w.tx_hash && !!w.user_op_hash;
      const isOut = w.kind !== "claim";
      items.push({
        hash: hashLower,
        timestamp: w.createdAt.toISOString(),
        direction: isOut ? "out" : "in",
        kind: (w.kind === "tip" || w.kind === "claim" || w.kind === "register") ? w.kind as HistItem["kind"] : "transfer",
        token: w.token || ETH_ADDRESS,
        symbol: w.token ? getTokenSymbol(w.token) : "—",
        decimals: w.token ? getTokenDecimals(w.token) : 18,
        amount: w.amount || "0",
        counterparty: w.to_address || null,
        repo_id: w.repo_id,
        status: w.status,
        isUserOp: isUserOpOnly || undefined,
      });
    }
  } catch (e) {
    // WalletTx table missing (pre-migration) — history still works without it.
    console.error("wallet history wallettx failed (table may not be migrated yet)", e);
  }

  // 3) Chain leg — Alchemy Transfers (free tier, deposits + token legs for both
  // EOAs and smart wallets). Smart-wallet ETH legs come from the write-ahead
  // log above, since no free API covers internal traces on Base.
  const errors: string[] = [];
  const alchemyUrl = process.env.ALCHEMY_RPC_URL || "";

  if (alchemyUrl) {
    for (const dir of ["in", "out"] as const) {
      let transfers: any[] = [];
      try {
        transfers = await alchemyTransfers(dir, address as string, alchemyUrl);
      } catch (e: any) {
        errors.push(`alchemy-${dir}: ${e.message || "failed"}`);
        continue;
      }
      for (const t of transfers) {
        const hash = String(t.hash || "").toLowerCase();
        if (!hash || seen.has(hash)) continue;
        seen.add(hash);
        const isErc20 = t.category === "erc20";
        let amount = "0";
        try {
          if (t.rawContract?.value) amount = BigInt(t.rawContract.value).toString();
          else continue;
        } catch { continue; }
        const from = String(t.from || "").toLowerCase();
        const to = String(t.to || "").toLowerCase();
        const involvesContract = from === contract || to === contract;
        const ts = t.metadata?.blockTimestamp;
        if (!ts) continue;
        items.push({
          hash: t.hash,
          timestamp: new Date(ts).toISOString(),
          direction: to === address ? "in" : "out",
          kind: involvesContract ? (to === contract ? "tip" : "claim") : "transfer",
          token: isErc20 ? String(t.rawContract?.address || "") : ETH_ADDRESS,
          symbol: isErc20 ? String(t.asset || "TOKEN") : "ETH",
          decimals: isErc20
            ? (() => {
                const d = String(t.rawContract?.decimal ?? "18");
                const n = d.startsWith("0x") ? parseInt(d, 16) : parseInt(d, 10);
                return Number.isFinite(n) && n > 0 ? n : 18;
              })()
            : 18,
          amount,
          counterparty: to === address ? t.from : t.to,
          repo_id: null,
        });
      }
    }
  }

  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const chainConfigured = !!alchemyUrl;
  const data = {
    items: items.slice(0, limit),
    chainUnavailable: !chainConfigured || errors.length > 0,
    chainError: errors.length > 0 ? errors.join("; ") : null,
  };
  cache.set(cacheKey, { ts: Date.now(), data });
  return NextResponse.json(data);
}
