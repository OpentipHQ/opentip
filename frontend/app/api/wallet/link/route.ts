import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;
  if (!userId) return NextResponse.json({ error: "no userId in session" }, { status: 400 });

  const { address, signature, nonce } = await req.json();
  if (!address || !signature) return NextResponse.json({ error: "address and signature required" }, { status: 400 });

  const login = (session.user as any).login || session.user.name || "user";
  const message = nonce ? `Link wallet ${address} to ${login} ${nonce}` : `Link wallet ${address} to ${login}`;

  const sigHex = signature.startsWith("0x") ? signature : `0x${signature}`;

  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
  const rpcUrl = projectId
    ? `https://rpc.walletconnect.org/v1/?chainId=eip155:8453&projectId=${projectId}`
    : (process.env.RPC_URL || "https://mainnet.base.org");
  const client = createPublicClient({ chain: base, transport: http(rpcUrl) });

  let verified = false;
  try {
    verified = await client.verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: sigHex as `0x${string}`,
    });
  } catch {}

  if (!verified) return NextResponse.json({ error: "invalid signature" }, { status: 400 });

  const lower = address.toLowerCase();
  const existing = await prisma.userWallet.findUnique({ where: { address: lower } });
  if (existing && existing.userId !== userId) return NextResponse.json({ error: "address already linked to another account" }, { status: 400 });

  const wallet = await prisma.userWallet.upsert({
    where: { address: lower },
    create: { userId, address: lower, signature: sigHex },
    update: { userId, signature: sigHex },
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
