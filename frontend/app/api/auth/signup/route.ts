import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "email and password required" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  const lower = email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: lower } });
  if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 400 });
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email: lower, passwordHash: hash, name: name || null } });
  return NextResponse.json({ ok: true, id: user.id });
}
