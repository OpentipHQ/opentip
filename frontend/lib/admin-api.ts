import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AdminAuthError, AdminRole } from "@/lib/admin-auth";
import { rateLimit, rateLimitKey, RateLimitError } from "@/lib/rate-limit";
import { ValidationError } from "@/lib/validations";
import { prisma } from "@/lib/prisma";

export async function handleAdminRequest(
  req: NextRequest,
  tier: "read" | "write" | "critical",
  handler: (admin: { role: AdminRole; address: string; userId: string }) => Promise<any>
): Promise<NextResponse> {
  try {
    const key = rateLimitKey(req);
    rateLimit(key, tier);

    const admin = await requireAdmin(req);
    // Viewer role is intentionally read-only — block all writes.
    if (tier !== "read" && admin.role === "viewer") {
      throw new AdminAuthError("viewers are read-only", 403);
    }
    const result = await handler(admin);
    return NextResponse.json(result);
  } catch (e: any) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e instanceof RateLimitError) {
      return NextResponse.json({ error: e.message }, { status: 429, headers: { "Retry-After": String(e.retryAfter) } });
    }
    if (e instanceof ValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error("Admin API error:", e.message);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

export async function auditLog(adminAddr: string, action: string, params: any, txHash?: string) {
  try {
    await prisma.adminAuditLog.create({
      data: { adminAddr, action, params, txHash },
    });
  } catch (e) {
    console.error("Audit log failed:", e);
  }
}
