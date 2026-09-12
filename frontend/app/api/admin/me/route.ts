import { NextRequest } from "next/server";
import { handleAdminRequest } from "@/lib/admin-api";

export async function GET(req: NextRequest) {
  return handleAdminRequest(req, "read", async (admin) => {
    return { role: admin.role, address: admin.address };
  });
}
