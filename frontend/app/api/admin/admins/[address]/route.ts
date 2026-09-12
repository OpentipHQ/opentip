import { NextRequest } from "next/server";
import { handleAdminRequest, auditLog } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: { address: string } }) {
  return handleAdminRequest(req, "critical", async (admin) => {
    const address = params.address.toLowerCase();

    const existing = await prisma.admin.findUnique({ where: { address } });
    if (!existing) {
      throw new Error("admin not found");
    }

    await prisma.admin.delete({ where: { address } });
    await auditLog(admin.address, "remove_admin", { address });

    return { ok: true };
  });
}
