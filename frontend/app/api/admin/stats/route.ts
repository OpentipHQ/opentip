import { NextRequest } from "next/server";
import { handleAdminRequest } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { createPublicClient, http } from "viem";
import { baseSepolia, base } from "viem/chains";
import { opentipAbi, getContractAddress, getUsdcAddress, usdcAbi } from "@/lib/contract";

const chain = process.env.NEXT_PUBLIC_CHAIN === "base" ? base : baseSepolia;

export async function GET(req: NextRequest) {
  return handleAdminRequest(req, "read", async () => {
    const [totalTips, totalRepos, totalUsers, recentTips] = await Promise.all([
      prisma.tip.aggregate({ _sum: { usdc_amount: true, fee_amount: true }, _count: true }),
      prisma.repo.count(),
      prisma.user.count(),
      prisma.tip.findMany({
        orderBy: { timestamp: "desc" },
        take: 20,
        select: {
          tipper_address: true,
          repo_id: true,
          usdc_amount: true,
          fee_amount: true,
          timestamp: true,
          tx_hash: true,
        },
      }),
    ]);

    let treasuryBalance = "0";
    try {
      const client = createPublicClient({ chain, transport: http() });
      const contract = getContractAddress();
      if (contract) {
        const bal = await client.readContract({
          address: contract,
          abi: opentipAbi,
          functionName: "getTreasuryBalance",
        });
        treasuryBalance = bal.toString();
      }
    } catch {}

    return {
      totalTipsUsdc: Number(totalTips._sum.usdc_amount || 0),
      totalFeesUsdc: Number(totalTips._sum.fee_amount || 0),
      totalTipCount: totalTips._count || 0,
      totalRepos,
      totalUsers,
      treasuryBalance,
      recentTips: recentTips.map((t) => ({
        ...t,
        usdc_amount: Number(t.usdc_amount),
        fee_amount: Number(t.fee_amount),
        block_number: Number((t as any).block_number || 0),
      })),
    };
  });
}
