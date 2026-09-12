import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyMessage } from "viem";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;
  if (!userId) return NextResponse.json({ error: "no userId in session" }, { status: 400 });

  const { address, signature, nonce } = await req.json();
  if (!address || !signature) return NextResponse.json({ error: "address and signature required" }, { status: 400 });

  const login = (session.user as any).login || session.user.name || "user";
  const message = nonce ? `Link wallet ${address} to ${login} ${nonce}` : `Link wallet ${address} to ${login}`;
  const valid = await verifyMessage({ address: address as `0x${string}`, message, signature: signature as `0x${string}` });
  if (!valid) return NextResponse.json({ error: "invalid signature" }, { status: 400 });

  const lower = address.toLowerCase();
  // ensure address not linked to another user
  const existing = await prisma.userWallet.findUnique({ where: { address: lower } });
  if (existing && existing.userId !== userId) return NextResponse.json({ error: "address already linked to another account" }, { status: 400 });

  const wallet = await prisma.userWallet.upsert({
    where: { address: lower },
    create: { userId, address: lower, signature },
    update: { userId, signature },
  });

  return NextResponse.json({ ok: true, wallet });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;
  const wallets = await prisma.userWallet.findMany({ where: { userId } });
  return NextResponse.json(wallets);
}
