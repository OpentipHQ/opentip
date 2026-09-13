import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const repoId = req.nextUrl.searchParams.get("repoId")?.toLowerCase() || null;

  const rows: any[] = repoId
    ? await prisma.$queryRaw`
        SELECT tipper_address, SUM(usdc_amount)::text as total
        FROM "Tip"
        WHERE repo_id = ${repoId}
        GROUP BY tipper_address ORDER BY SUM(usdc_amount) DESC LIMIT 20
      `
    : await prisma.$queryRaw`
        SELECT tipper_address, SUM(usdc_amount)::text as total
        FROM "Tip"
        GROUP BY tipper_address ORDER BY SUM(usdc_amount) DESC LIMIT 20
      `;

  const addrs = rows.map((r: any) => r.tipper_address);
  const names = addrs.length ? await prisma.displayName.findMany({ where: { tipper_address: { in: addrs } } }) : [];
  const nameMap = new Map(names.map(n => [n.tipper_address.toLowerCase(), n.display_name]));
  return NextResponse.json(rows.map((r: any) => ({ tipper_address: r.tipper_address, total: r.total, display_name: nameMap.get(r.tipper_address.toLowerCase()) || null })));
}
