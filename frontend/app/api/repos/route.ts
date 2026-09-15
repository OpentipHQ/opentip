import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const q = url.searchParams.get("q") || "";
  const sort = url.searchParams.get("sort") || "tipped";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));

  const where = q
    ? { hidden: false, repo_id: { contains: q, mode: "insensitive" as const } }
    : { hidden: false };

  if (sort === "recent") {
    const total = await prisma.repo.count({ where });
    const repos = await prisma.repo.findMany({
      where,
      orderBy: { registered_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const repoIds = repos.map(r => r.repo_id);
    const tipAgg = repoIds.length > 0 ? await prisma.tip.groupBy({
      by: ["repo_id"],
      where: { repo_id: { in: repoIds } },
      _sum: { usdc_amount: true },
      _count: true,
    }) : [];

    const tipMap = new Map<string, { total: bigint; count: number }>();
    for (const row of tipAgg) {
      tipMap.set(row.repo_id, { total: row._sum.usdc_amount ?? BigInt(0), count: row._count });
    }

    return NextResponse.json({
      items: repos.map(r => {
        const agg = tipMap.get(r.repo_id);
        return {
          repo_id: r.repo_id,
          payout_address: r.payout_address,
          registered_at: r.registered_at,
          total_tipped: (agg?.total ?? BigInt(0)).toString(),
          tip_count: agg?.count ?? 0,
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  }

  const repos = await prisma.repo.findMany({ where });
  if (repos.length === 0) {
    return NextResponse.json({ items: [], total: 0, page: 1, limit, totalPages: 0 });
  }

  const repoIds = repos.map(r => r.repo_id);
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

  let items = repos.map(r => {
    const agg = tipMap.get(r.repo_id);
    return {
      repo_id: r.repo_id,
      payout_address: r.payout_address,
      registered_at: r.registered_at,
      total_tipped: (agg?.total ?? BigInt(0)).toString(),
      tip_count: agg?.count ?? 0,
    };
  });

  if (sort === "tipped") {
    items.sort((a, b) => Number(BigInt(b.total_tipped) - BigInt(a.total_tipped)));
  } else if (sort === "tips") {
    items.sort((a, b) => b.tip_count - a.tip_count);
  }

  const total = items.length;
  const start = (page - 1) * limit;
  const paged = items.slice(start, start + limit);

  return NextResponse.json({
    items: paged,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
