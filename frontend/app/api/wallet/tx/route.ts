import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const KINDS = new Set(["send", "tip", "claim", "register"]);
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const HASH_RE = /^0x[0-9a-fA-F]{64}$/;

async function ownWallet(userId: string, wallet: string) {
  const w = await prisma.userWallet.findFirst({
    where: { userId, address: wallet.toLowerCase() },
    select: { address: true },
  });
  return !!w;
}

// POST: record a submitted transaction (pending). Body:
// { walletAddress, kind, repoId?, token?, amount?, toAddress?, userOpHash?, txHash? }
// At least one of userOpHash / txHash required. Upserts by whichever id is given.
export async function POST(req: NextRequest) {
  try { rateLimit(rateLimitKey(req, "wallet-tx"), "write"); } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 429, headers: { "Retry-After": String(e.retryAfter) } });
  }
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "not authenticated" }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const { walletAddress, kind, repoId, token, amount, toAddress, userOpHash, txHash } = body || {};
  if (typeof walletAddress !== "string" || !ADDRESS_RE.test(walletAddress)) {
    return NextResponse.json({ error: "invalid walletAddress" }, { status: 400 });
  }
  if (!KINDS.has(kind)) return NextResponse.json({ error: "invalid kind" }, { status: 400 });
  if (userOpHash !== undefined && (typeof userOpHash !== "string" || !HASH_RE.test(userOpHash))) {
    return NextResponse.json({ error: "invalid userOpHash" }, { status: 400 });
  }
  if (txHash !== undefined && (typeof txHash !== "string" || !HASH_RE.test(txHash))) {
    return NextResponse.json({ error: "invalid txHash" }, { status: 400 });
  }
  if (!userOpHash && !txHash) {
    return NextResponse.json({ error: "userOpHash or txHash required" }, { status: 400 });
  }
  if (token !== undefined && (typeof token !== "string" || !ADDRESS_RE.test(token))) {
    return NextResponse.json({ error: "invalid token" }, { status: 400 });
  }
  if (toAddress !== undefined && (typeof toAddress !== "string" || !ADDRESS_RE.test(toAddress))) {
    return NextResponse.json({ error: "invalid toAddress" }, { status: 400 });
  }

  const wallet = walletAddress.toLowerCase();
  if (!(await ownWallet(userId, wallet))) {
    return NextResponse.json({ error: "wallet not linked to account" }, { status: 403 });
  }

  const data = {
    wallet,
    kind,
    repo_id: typeof repoId === "string" ? repoId.toLowerCase().slice(0, 200) : null,
    token: typeof token === "string" ? token.toLowerCase() : null,
    amount: typeof amount === "string" ? amount.slice(0, 100) : null,
    to_address: typeof toAddress === "string" ? toAddress.toLowerCase() : null,
    status: txHash && !userOpHash ? "confirmed" : "pending",
  };
  try {
    const row = userOpHash
      ? await prisma.walletTx.upsert({
          where: { user_op_hash: userOpHash.toLowerCase() },
          create: { ...data, user_op_hash: userOpHash.toLowerCase(), tx_hash: txHash ? txHash.toLowerCase() : null },
          update: { ...(txHash ? { tx_hash: txHash.toLowerCase(), status: "confirmed" } : {}) },
        })
      : await prisma.walletTx.upsert({
          where: { tx_hash: (txHash as string).toLowerCase() },
          create: { ...data, tx_hash: (txHash as string).toLowerCase() },
          update: {},
        });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    console.error("wallet tx log failed", e);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

// PATCH: confirm a pending row once the chain hash is known. Body: { userOpHash, txHash }
export async function PATCH(req: NextRequest) {
  try { rateLimit(rateLimitKey(req, "wallet-tx"), "write"); } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 429, headers: { "Retry-After": String(e.retryAfter) } });
  }
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "not authenticated" }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const { userOpHash, txHash } = body || {};
  if (typeof userOpHash !== "string" || !HASH_RE.test(userOpHash)) {
    return NextResponse.json({ error: "invalid userOpHash" }, { status: 400 });
  }
  if (typeof txHash !== "string" || !HASH_RE.test(txHash)) {
    return NextResponse.json({ error: "invalid txHash" }, { status: 400 });
  }
  try {
    const row = await prisma.walletTx.findUnique({ where: { user_op_hash: userOpHash.toLowerCase() } });
    if (!row || !(await ownWallet(userId, row.wallet))) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    await prisma.walletTx.update({
      where: { user_op_hash: userOpHash.toLowerCase() },
      data: { tx_hash: txHash.toLowerCase(), status: "confirmed" },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("wallet tx confirm failed", e);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
