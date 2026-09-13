import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const repoId = req.nextUrl.searchParams.get("repoId");
  if (!repoId) return NextResponse.json({ error: "repoId required" }, { status: 400 });

  const repo = await prisma.repo.findUnique({
    where: { repo_id: repoId.toLowerCase() },
    select: { payout_address: true },
  });

  if (!repo) return NextResponse.json({ registered: false });

  const agg = await prisma.tip.aggregate({
    where: { repo_id: repoId.toLowerCase() },
    _sum: { usdc_amount: true },
    _count: true,
  });

  return NextResponse.json({
    registered: true,
    payoutAddress: repo.payout_address,
    totalTipped: (agg._sum.usdc_amount ?? BigInt(0)).toString(),
    tipCount: agg._count,
  });
}
