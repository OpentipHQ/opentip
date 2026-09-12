import { NextRequest } from "next/server";
import { handleAdminRequest } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  return handleAdminRequest(req, "read", async () => {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const [tips, total] = await Promise.all([
      prisma.tip.findMany({
        orderBy: { timestamp: "desc" },
        skip,
        take: limit,
        select: {
          tipper_address: true,
          repo_id: true,
          usdc_amount: true,
          fee_amount: true,
          timestamp: true,
          tx_hash: true,
          block_number: true,
        },
      }),
      prisma.tip.count(),
    ]);

    return {
      tips: tips.map((t) => ({
        ...t,
        usdc_amount: Number(t.usdc_amount),
        fee_amount: Number(t.fee_amount),
        block_number: Number(t.block_number),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });
}
