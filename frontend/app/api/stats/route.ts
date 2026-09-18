import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows: any[] = await prisma.$queryRaw`
    SELECT token, SUM(amount)::text as total
    FROM "Tip"
    GROUP BY token
  `;

  const tipCount = await prisma.tip.count();

  const [developerResult] = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(DISTINCT r.payout_address) as count 
    FROM "Tip" t 
    INNER JOIN "Repo" r ON t.repo_id = r.repo_id
  `;

  return NextResponse.json({
    tokenVolumes: rows.map((r: any) => ({ token: r.token, total: r.total })),
    totalTips: tipCount,
    developersPaid: Number(developerResult.count),
  });
}
