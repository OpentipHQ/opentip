import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { randomBytes } from "crypto";
import { createHash } from "crypto";

const RATE_LIMIT_WINDOW = 60 * 60 * 1000;
const MAX_REQUESTS = 3;
const resetRequests = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = resetRequests.get(identifier);
  if (!record || now > record.resetAt) {
    resetRequests.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (record.count >= MAX_REQUESTS) return false;
  record.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const lower = email.toLowerCase().trim();

  if (!checkRateLimit(lower)) {
    return NextResponse.json({ error: "too many requests, try again later" }, { status: 429 });
  }

  const user = await prisma.user.findUnique({
    where: { email: lower },
    select: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: tokenHash,
      resetTokenExpiry: expiry,
    },
  });

  try {
    await sendPasswordResetEmail(user.email!, rawToken);
  } catch (error) {
    console.error("Failed to send reset email:", error);
    return NextResponse.json({ error: "failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
