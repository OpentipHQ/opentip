import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const repoId = req.nextUrl.searchParams.get("repoId")?.toLowerCase() || null;
  const limit = Math.min(100, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "50", 10)));
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1", 10));
  const offset = (page - 1) * limit;

  const where = repoId ? { repo_id: repoId } : {};

  const tips = await prisma.tip.findMany({
    where,
    orderBy: { timestamp: "desc" },
    skip: offset,
    take: limit,
  });

  const tipperAddresses = [...new Set(tips.map(t => t.tipper_address))];
  const displayNames = tipperAddresses.length > 0
    ? await prisma.displayName.findMany({ where: { tipper_address: { in: tipperAddresses } } })
    : [];
  const nameMap = new Map(displayNames.map(n => [n.tipper_address.toLowerCase(), n.display_name]));

  return NextResponse.json(
    tips.map(t => ({
      ...t,
      usdc_amount: t.usdc_amount.toString(),
      fee_amount: t.fee_amount.toString(),
      block_number: t.block_number.toString(),
      display_name: nameMap.get(t.tipper_address.toLowerCase()) || null,
    }))
  );
}
