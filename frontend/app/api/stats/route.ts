import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const [volumeResult] = await prisma.$queryRaw<[{ total: bigint }]>`
    SELECT COALESCE(SUM(usdc_amount), 0) as total FROM "Tip"
  `;
  
  const tipCount = await prisma.tip.count();

  const [developerResult] = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(DISTINCT r.payout_address) as count 
    FROM "Tip" t 
    INNER JOIN "Repo" r ON t.repo_id = r.repo_id
  `;

  return NextResponse.json({
    totalVolume: volumeResult.total.toString(),
    totalTips: tipCount,
    developersPaid: Number(developerResult.count),
  });
}
