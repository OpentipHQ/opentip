import { NextRequest } from "next/server";
import { handleAdminRequest, auditLog } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ address: string }> }) {
  return handleAdminRequest(req, "critical", async (admin) => {
    const { address: rawAddress } = await params;
    const address = rawAddress.toLowerCase();

    if (address === admin.address.toLowerCase()) {
      throw new Error("cannot remove yourself");
    }

    const ownerAddress = process.env.NEXT_PUBLIC_OWNER_ADDRESS?.toLowerCase();
    if (ownerAddress && address === ownerAddress) {
      throw new Error("cannot remove the owner");
    }

    const existing = await prisma.admin.findUnique({ where: { address } });
    if (!existing) {
      throw new Error("admin not found");
    }

    await prisma.admin.delete({ where: { address } });
    await auditLog(admin.address, "remove_admin", { address });

    return { ok: true };
  });
}
