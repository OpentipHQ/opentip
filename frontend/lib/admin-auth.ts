import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AdminRole = "owner" | "admin" | "viewer";

export interface AdminAuthResult {
  role: AdminRole;
  address: string;
  userId: string;
}

export async function requireAdmin(_req?: NextRequest): Promise<AdminAuthResult> {
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new AdminAuthError("unauthenticated", 401);
  }

  const userId = session.user.id;

  // Find all wallet addresses linked to this user
  const wallets = await prisma.userWallet.findMany({
    where: { userId },
    select: { address: true },
  });

  if (wallets.length === 0) {
    throw new AdminAuthError("no linked wallet", 403);
  }

  const ownerAddress = process.env.OWNER_ADDRESS?.toLowerCase();

  // Check if any linked wallet is the owner
  for (const wallet of wallets) {
    if (ownerAddress && wallet.address.toLowerCase() === ownerAddress) {
      return { role: "owner", address: wallet.address, userId };
    }
  }

  // Check if any linked wallet is in the Admin table
  for (const wallet of wallets) {
    const admin = await prisma.admin.findUnique({
      where: { address: wallet.address.toLowerCase() },
    });
    if (admin) {
      return { role: admin.role as AdminRole, address: wallet.address, userId };
    }
  }

  throw new AdminAuthError("not authorized", 403);
}

export async function requireOwner(): Promise<AdminAuthResult> {
  const admin = await requireAdmin();
  if (admin.role !== "owner") {
    throw new AdminAuthError("owner access required", 403);
  }
  return admin;
}

export class AdminAuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
