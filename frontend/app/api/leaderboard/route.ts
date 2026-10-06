import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenSymbol, getTokenDecimals } from "@/lib/chain";
import { getTokenPrices, usdValue } from "@/lib/prices";
import { rowsForTopTippers, type TipAggregateRow } from "@/lib/leaderboard-rank";

export async function GET(req: NextRequest) {
  const repoId = req.nextUrl.searchParams.get("repoId")?.toLowerCase() || null;

  const [grouped, prices] = await Promise.all([
    repoId
      ? prisma.$queryRaw<TipAggregateRow[]>`
          SELECT tipper_address, SUM(amount)::text as total, token
          FROM "Tip"
          WHERE repo_id = ${repoId}
          GROUP BY tipper_address, token
        `
      : prisma.$queryRaw<TipAggregateRow[]>`
          SELECT tipper_address, SUM(amount)::text as total, token
          FROM "Tip"
          GROUP BY tipper_address, token
        `,
    getTokenPrices(),
  ]);
  const rows = rowsForTopTippers(grouped, prices, 20, usdValue);

  const addrs = rows.map((r) => r.tipper_address);
  const names = addrs.length ? await prisma.displayName.findMany({ where: { tipper_address: { in: addrs } } }) : [];
  const nameMap = new Map(names.map(n => [n.tipper_address.toLowerCase(), n.display_name]));
  return NextResponse.json(rows.map((r: any) => ({
    tipper_address: r.tipper_address,
    total: r.total,
    token: r.token || "USDC",
    symbol: getTokenSymbol(r.token),
    decimals: getTokenDecimals(r.token),
    display_name: nameMap.get(r.tipper_address.toLowerCase()) || null,
  })));
}
