import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const { email } = await req.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const lower = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(lower)) {
    return NextResponse.json({ error: "invalid email format" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });

  if (!user) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  if (user.email) {
    return NextResponse.json({ error: "email already set and cannot be changed" }, { status: 400 });
  }

  const existingEmail = await prisma.user.findUnique({
    where: { email: lower },
    select: { id: true },
  });

  if (existingEmail) {
    return NextResponse.json({ error: "email already in use" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { email: lower, emailVerified: new Date() },
  });

  return NextResponse.json({ ok: true });
}
