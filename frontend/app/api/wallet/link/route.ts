import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { CdpClient } from "@coinbase/cdp-sdk";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const MAX_SIG_LEN = 1024;

// Server-side proof that an address belongs to the caller's CDP end-user
// account. The client sends its CDP access token and we validate it with
// CDP directly (validateAccessToken), which resolves the token to its end
// user authoritatively — no mapping between app ids and CDP ids is assumed
// anywhere (CDP end-user ids are CDP-generated and differ from ours).
// verifyMessage can't prove TEE-custodied ownership, so we ask CDP directly
// with our secret API key instead of trusting the client's walletType claim.
// Fails closed: any CDP error rejects the link.
async function assertCdpOwnership(appUserId: string, addressLower: string, accessToken?: string | null): Promise<"smart" | "eoa"> {
  let cdp: any;
  try {
    cdp = new CdpClient();
  } catch {
    throw { status: 503, error: "wallet verification unavailable — try again" };
  }
  let endUser: any;
  if (accessToken) {
    try {
      endUser = await cdp.endUser.validateAccessToken({ accessToken });
    } catch (e: any) {
      const code = e?.status || e?.statusCode || e?.response?.status;
      if (code === 401) throw { status: 401, error: "CDP session expired — try again" };
      throw { status: 502, error: "wallet verification unavailable — try again" };
    }
  } else {
    // Legacy fallback: only works if CDP keyed the end user by app id.
    try {
      endUser = await cdp.endUser.getEndUser({ userId: appUserId });
    } catch (e: any) {
      const code = e?.status || e?.statusCode || e?.response?.status;
      if (code === 404) throw { status: 503, error: "wallet verification unavailable — try again" };
      throw { status: 502, error: "wallet verification unavailable — try again" };
    }
  }
  const smarts = new Set<string>([
    ...((endUser?.evmSmartAccountObjects || []).map((a: any) => String(a?.address || "").toLowerCase())),
    ...((endUser?.evmSmartAccounts || []).map((a: any) => String(a || "").toLowerCase())),
  ]);
  if (smarts.has(addressLower)) return "smart";
  const eoas = new Set<string>([
    ...((endUser?.evmAccountObjects || []).map((a: any) => String(a?.address || "").toLowerCase())),
    ...((endUser?.evmAccounts || []).map((a: any) => String(a || "").toLowerCase())),
  ]);
  if (eoas.has(addressLower)) return "eoa";
  throw { status: 403, error: "address not owned by CDP end user" };
}

export async function POST(req: NextRequest) {
  try { rateLimit(rateLimitKey(req, "wallet-link"), "write"); } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 429, headers: { "Retry-After": String(e.retryAfter) } });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;
  if (!userId) return NextResponse.json({ error: "no userId in session" }, { status: 400 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const { address, signature, nonce, walletType, isPrimary, subAccountAddress, cdpAccessToken } = body || {};
  if (typeof address !== "string" || typeof signature !== "string" || !address || !signature) {
    return NextResponse.json({ error: "address and signature required" }, { status: 400 });
  }
  if (!ADDRESS_RE.test(address)) return NextResponse.json({ error: "invalid address" }, { status: 400 });
  if (signature.length > MAX_SIG_LEN) return NextResponse.json({ error: "invalid signature" }, { status: 400 });

  const lower = address.toLowerCase();
  const subLower = subAccountAddress ? String(subAccountAddress).toLowerCase() : null;
  const existing = await prisma.userWallet.findUnique({ where: { address: lower } });
  if (existing && existing.userId !== userId) return NextResponse.json({ error: "address already linked to another account" }, { status: 400 });

  // Never trust the client's walletType claim — prove ownership first.
  // CDP server-side proof covers both smart and EOA lists (the Create flow
  // can fall back to a CDP EOA whose key is TEE-custodied and unsignable).
  // Flipping flags on a wallet you already own (e.g. Set primary) needs no
  // fresh signature — ownership was proven at link time.
  let type: "smart" | "eoa";
  let verified = false;
  let freshSig: string | null = null;
  if (existing) {
    type = (existing as any).walletType === "smart" ? "smart" : "eoa";
    verified = true;
    if (walletType === "smart" && type !== "smart") {
      try {
        type = await assertCdpOwnership(userId, lower, typeof cdpAccessToken === "string" ? cdpAccessToken : null);
      } catch (e: any) {
        if (e?.status) return NextResponse.json({ error: e.error || "verification failed" }, { status: e.status });
        throw e;
      }
    }
  } else if (walletType === "smart") {
    try {
      type = await assertCdpOwnership(userId, lower, typeof cdpAccessToken === "string" ? cdpAccessToken : null);
      verified = true;
    } catch (e: any) {
      if (e?.status) return NextResponse.json({ error: e.error || "verification failed" }, { status: e.status });
      throw e;
    }
  } else {
    type = "eoa";
  }

  // One smart wallet per user — linking a second would strand funds with
  // no recovery path. Flag flips on the already-linked address still pass.
  if (type === "smart") {
    const otherSmart = await prisma.userWallet.findFirst({
      where: { userId, walletType: "smart", address: { not: lower } },
      select: { address: true },
    });
    if (otherSmart) {
      return NextResponse.json({ error: "smart wallet already exists for this account" }, { status: 400 });
    }
  }
  const wantsPrimary = !!isPrimary;

  if (!verified) {
    const login = (session.user as any).login || session.user.name || "user";
    const message = nonce ? `Link wallet ${address} to ${login} ${nonce}` : `Link wallet ${address} to ${login}`;
    const sigHex = signature.startsWith("0x") ? signature : `0x${signature}`;
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
    const rpcUrl = projectId
      ? `https://rpc.walletconnect.org/v1/?chainId=eip155:8453&projectId=${projectId}`
      : (process.env.RPC_URL || "https://mainnet.base.org");
    const client = createPublicClient({ chain: base, transport: http(rpcUrl) });
    try {
      verified = await client.verifyMessage({
        address: address as `0x${string}`,
        message,
        signature: sigHex as `0x${string}`,
      });
    } catch {}
    if (!verified) return NextResponse.json({ error: "invalid signature" }, { status: 400 });
    freshSig = signature.startsWith("0x") ? signature : `0x${signature}`;
  }

  const sigHex = signature.startsWith("0x") ? signature : `0x${signature}`;

  if (wantsPrimary) {
    await prisma.userWallet.updateMany({ where: { userId }, data: { isPrimary: false } });
  }
  const count = await prisma.userWallet.count({ where: { userId } });
  const shouldBePrimary = wantsPrimary || (count === 0);

  const wallet = await prisma.userWallet.upsert({
    where: { address: lower },
    create: { userId, address: lower, signature: sigHex, walletType: type, isPrimary: shouldBePrimary, subAccountAddress: subLower },
    // Never clobber the stored link proof or sub-account with dummy values
    // on flag flips — only overwrite with fresh proof/metadata when provided.
    update: {
      userId,
      ...(freshSig ? { signature: freshSig } : {}),
      walletType: type,
      isPrimary: shouldBePrimary,
      ...(subLower !== null ? { subAccountAddress: subLower } : {}),
    },
  });

  return NextResponse.json({ ok: true, wallet });
}

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const wallets = await prisma.userWallet.findMany({ where: { userId } });

  const addresses = wallets.map((w) => w.address);
  const repos = await prisma.repo.findMany({
    where: { payout_address: { in: addresses } },
    select: { payout_address: true },
  });

  const repoCountMap = new Map<string, number>();
  for (const r of repos) {
    repoCountMap.set(r.payout_address, (repoCountMap.get(r.payout_address) || 0) + 1);
  }

  const result = wallets.map((w) => ({
    address: w.address,
    walletType: (w as any).walletType || "eoa",
    isPrimary: (w as any).isPrimary || false,
    subAccountAddress: (w as any).subAccountAddress || null,
    repoCount: repoCountMap.get(w.address) || 0,
  }));

  return NextResponse.json(result);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const { address } = await req.json();
  if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });

  const lower = address.toLowerCase();
  const wallet = await prisma.userWallet.findUnique({ where: { address: lower } });
  if (!wallet || wallet.userId !== userId) return NextResponse.json({ error: "wallet not found" }, { status: 404 });

  const repoCount = await prisma.repo.count({ where: { payout_address: lower } });
  if (repoCount > 0) {
    return NextResponse.json({ error: `This wallet is the payout address for ${repoCount} repo(s). Unregister the repo(s) first.`, repoCount }, { status: 400 });
  }

  await prisma.userWallet.delete({ where: { address: lower } });
  return NextResponse.json({ ok: true });
}
