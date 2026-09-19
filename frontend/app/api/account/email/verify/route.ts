import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export async function POST(req: NextRequest) {
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const { code } = await req.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "code required" }, { status: 400 });
  }

  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "code must be 6 digits" }, { status: 400 });
  }

  const userId = session.user.id;
  const now = Date.now();

  const record = attempts.get(userId);
  if (record && now < record.resetAt && record.count >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "too many attempts, request a new code" }, { status: 429 });
  }

  const hashedCode = hashCode(code);

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      emailVerifyToken: hashedCode,
      emailVerifyExpiry: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!user) {
    if (!record || now > record.resetAt) {
      attempts.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 });
    } else {
      record.count++;
    }
    return NextResponse.json({ error: "invalid or expired code" }, { status: 400 });
  }

  attempts.delete(userId);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      emailVerifyToken: null,
      emailVerifyExpiry: null,
    },
  });

  return NextResponse.json({ ok: true });
}
