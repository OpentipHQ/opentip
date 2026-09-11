import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyMessage } from "viem";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { address, displayName, signature } = await req.json();
  if (!address || !displayName || !signature) return NextResponse.json({ error: "address, displayName, signature required" }, { status: 400 });
  if (displayName.length < 1 || displayName.length > 64) return NextResponse.json({ error: "displayName 1-64 chars" }, { status: 400 });

  const message = `Set display name: ${displayName} for ${address}`;
  const valid = await verifyMessage({ address: address as `0x${string}`, message, signature: signature as `0x${string}` });
  if (!valid) return NextResponse.json({ error: "invalid signature" }, { status: 400 });

  await prisma.displayName.upsert({
    where: { tipper_address: address.toLowerCase() },
    create: { tipper_address: address.toLowerCase(), display_name: displayName },
    update: { display_name: displayName },
  });
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const addr = req.nextUrl.searchParams.get("address");
  if (!addr) return NextResponse.json({ error: "address required" }, { status: 400 });
  const row = await prisma.displayName.findUnique({ where: { tipper_address: addr.toLowerCase() } });
  return NextResponse.json(row || {});
}
