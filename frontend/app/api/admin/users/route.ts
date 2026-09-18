import { NextRequest } from "next/server";
import { handleAdminRequest } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  return handleAdminRequest(req, "read", async () => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        wallets: { select: { address: true, linkedAt: true } },
      },
    });

    // Get tip stats for each user's wallets
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const walletAddresses = user.wallets.map((w) => w.address);
        if (walletAddresses.length === 0) {
          return {
            id: user.id,
            login: user.login,
            email: user.email,
            image: user.pfp || user.image,
            createdAt: user.createdAt,
            wallets: user.wallets,
            tipsReceived: 0,
            totalTipped: "0",
          };
        }

        const tipStats = await prisma.tip.aggregate({
          where: { tipper_address: { in: walletAddresses } },
          _sum: { amount: true },
          _count: true,
        });

        return {
          id: user.id,
          login: user.login,
          email: user.email,
          image: user.pfp || user.image,
          createdAt: user.createdAt,
          wallets: user.wallets,
          tipsReceived: tipStats._count || 0,
          totalTipped: Number(tipStats._sum.amount || 0),
        };
      })
    );

    return usersWithStats;
  });
}
