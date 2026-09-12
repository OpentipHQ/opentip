import { NextRequest } from "next/server";
import { handleAdminRequest, auditLog } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { validate, addAdminSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  return handleAdminRequest(req, "read", async () => {
    const admins = await prisma.admin.findMany({
      orderBy: { createdAt: "desc" },
    });
    return admins;
  });
}

export async function POST(req: NextRequest) {
  return handleAdminRequest(req, "critical", async (admin) => {
    const body = await req.json();
    const data = validate(addAdminSchema, body);

    const existing = await prisma.admin.findUnique({
      where: { address: data.address.toLowerCase() },
    });
    if (existing) {
      throw new Error("address already an admin");
    }

    const created = await prisma.admin.create({
      data: {
        address: data.address.toLowerCase(),
        role: data.role,
        addedBy: admin.address.toLowerCase(),
      },
    });

    await auditLog(admin.address, "add_admin", { address: data.address, role: data.role });

    return created;
  });
}
