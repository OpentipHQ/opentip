import { NextRequest } from "next/server";
import { handleAdminRequest } from "@/lib/admin-api";
import { isPaymasterHealthy } from "@/lib/paymaster";
import { prisma } from "@/lib/prisma";

const DAY = 24 * 3600 * 1000;

export async function GET(req: NextRequest) {
  return handleAdminRequest(req, "read", async () => {
    const since = new Date(Date.now() - 30 * DAY);
    const rows = await prisma.sponsoredTx.findMany({
      where: { createdAt: { gte: since } },
      include: { user: { select: { login: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    const usd = (r: { gasUsd: unknown }) => Number((r.gasUsd as any) ?? 0) || 0;
    const inLast = (ms: number) => {
      const cutoff = Date.now() - ms;
      return rows.filter((r) => r.createdAt.getTime() >= cutoff);
    };
    const summarize = (list: typeof rows) => ({
      txs: list.length,
      usd: list.reduce((a, r) => a + usd(r), 0),
    });

    const perDayMap = new Map<string, { txs: number; usd: number }>();
    for (const r of rows) {
      const day = r.createdAt.toISOString().slice(0, 10);
      const e = perDayMap.get(day) || { txs: 0, usd: 0 };
      e.txs += 1;
      e.usd += usd(r);
      perDayMap.set(day, e);
    }
    const perDay = [...perDayMap.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 14)
      .map(([date, s]) => ({ date, ...s }));

    const userMap = new Map<string, { label: string; txs: number; usd: number }>();
    for (const r of rows) {
      const label = r.user?.login || r.user?.email || r.userId.slice(0, 8);
      const e = userMap.get(r.userId) || { label, txs: 0, usd: 0 };
      e.txs += 1;
      e.usd += usd(r);
      userMap.set(r.userId, e);
    }
    const topUsers = [...userMap.values()].sort((a, b) => b.usd - a.usd).slice(0, 10);

    return {
      totals: {
        day: summarize(inLast(DAY)),
        week: summarize(inLast(7 * DAY)),
        month: summarize(rows),
      },
      perDay,
      topUsers,
      circuitHealthy: isPaymasterHealthy(),
      recent: rows.slice(0, 25).map((r) => ({
        id: r.id,
        createdAt: r.createdAt,
        user: r.user?.login || r.user?.email || r.userId.slice(0, 8),
        kind: r.kind,
        status: r.status,
        txHash: r.txHash,
        gasUsd: usd(r),
      })),
    };
  });
}
