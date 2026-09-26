import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try { rateLimit(rateLimitKey(req, "reset-confirm"), "critical"); } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 429, headers: { "Retry-After": String(e.retryAfter) } });
  }

  const { token, newPassword } = await req.json();

  if (!token || typeof token !== "string" || !/^[0-9a-f]{64}$/.test(token)) {
    return NextResponse.json({ error: "invalid token" }, { status: 400 });
  }

  if (!newPassword || typeof newPassword !== "string") {
    return NextResponse.json({ error: "new password required" }, { status: 400 });
  }

  if (newPassword.length < 8 || newPassword.length > 128) {
    return NextResponse.json({ error: "password must be 8-128 characters" }, { status: 400 });
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      resetToken: tokenHash,
      resetTokenExpiry: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "invalid or expired token" }, { status: 400 });
  }

  const hash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hash,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return NextResponse.json({ ok: true });
}
