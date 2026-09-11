import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  const userId = (session.user as any).id as string;
  if (!userId) return NextResponse.json({ error: "no userId" }, { status: 400 });

  const wallets = await prisma.userWallet.findMany({ where: { userId }, select: { address: true } });
  const addresses = wallets.map((w: { address: string }) => w.address.toLowerCase());
  if (addresses.length === 0) return NextResponse.json([]);

  const repos = await prisma.repo.findMany({
    where: { payout_address: { in: addresses } },
  });

  const repoIds = repos.map((r: { repo_id: string }) => r.repo_id);
  if (repoIds.length === 0) return NextResponse.json(repos.map((r: { repo_id: string; payout_address: string; registered_at: Date }) => ({ ...r, total_tipped: "0", tip_count: "0", pending: "0" })));

  const tipAgg = await prisma.tip.groupBy({
    by: ["repo_id"],
    where: { repo_id: { in: repoIds } },
    _sum: { usdc_amount: true },
    _count: true,
  });

  const tipMap = new Map<string, { total: bigint; count: number }>();
  for (const row of tipAgg) {
    tipMap.set(row.repo_id, { total: row._sum.usdc_amount ?? BigInt(0), count: row._count });
  }

  return NextResponse.json(
    repos.map((r: { repo_id: string; payout_address: string; registered_at: Date }) => {
      const agg = tipMap.get(r.repo_id);
      return {
        repo_id: r.repo_id,
        payout_address: r.payout_address,
        registered_at: r.registered_at,
        total_tipped: (agg?.total ?? BigInt(0)).toString(),
        tip_count: (agg?.count ?? 0).toString(),
      };
    })
  );
}
