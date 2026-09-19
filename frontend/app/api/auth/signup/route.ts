import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomInt, createHash } from "crypto";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try { rateLimit(rateLimitKey(req), "write"); } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 429, headers: { "Retry-After": String(e.retryAfter) } });
  }

  const { email, password, name } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "email and password required" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  const lower = email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: lower } });
  if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 400 });

  const code = String(randomInt(100000, 999999));
  const hashedCode = createHash("sha256").update(code).digest("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000);

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email: lower,
      passwordHash: hash,
      name: name || null,
      emailVerifyToken: hashedCode,
      emailVerifyExpiry: expiry,
    },
  });

  try {
    await sendVerificationEmail(lower, code);
  } catch (error) {
    console.error("Failed to send verification email:", error);
  }

  return NextResponse.json({ ok: true, id: user.id });
}
