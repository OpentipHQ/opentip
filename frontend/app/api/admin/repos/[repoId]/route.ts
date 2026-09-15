import { NextRequest } from "next/server";
import { handleAdminRequest, auditLog } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ repoId: string }> }
) {
  const { repoId } = await params;
  return handleAdminRequest(req, "write", async (admin) => {
    const body = await req.json();
    const hidden = body.hidden;
    if (typeof hidden !== "boolean") {
      throw new Error("hidden must be a boolean");
    }

    await prisma.repo.update({
      where: { repo_id: repoId.toLowerCase() },
      data: { hidden },
    });

    await auditLog(admin.address, "repo_hidden_toggle", { repoId: repoId.toLowerCase(), hidden });

    return { ok: true, hidden };
  });
}
