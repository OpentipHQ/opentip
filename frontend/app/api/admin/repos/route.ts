import { NextRequest } from "next/server";
import { handleAdminRequest } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  return handleAdminRequest(req, "read", async () => {
    const repos = await prisma.repo.findMany({
      orderBy: { registered_at: "desc" },
    });

    // Get tip stats for each repo
    const reposWithStats = await Promise.all(
      repos.map(async (repo) => {
        const stats = await prisma.tip.aggregate({
          where: { repo_id: repo.repo_id },
          _sum: { usdc_amount: true, fee_amount: true },
          _count: true,
        });
        return {
          repoId: repo.repo_id,
          payoutAddress: repo.payout_address,
          registeredAt: repo.registered_at,
          hidden: repo.hidden,
          totalTipped: Number(stats._sum.usdc_amount || 0),
          totalFees: Number(stats._sum.fee_amount || 0),
          tipCount: stats._count || 0,
        };
      })
    );

    return reposWithStats;
  });
}
