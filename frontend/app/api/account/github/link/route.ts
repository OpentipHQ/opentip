import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { randomBytes } from "crypto";

export async function POST() {
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const state = randomBytes(16).toString("hex");
  const clientId = process.env.GITHUB_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/account/github/callback`;

  if (!clientId) {
    return NextResponse.json({ error: "GitHub OAuth not configured" }, { status: 500 });
  }

  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=read%3Auser+public_repo&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  const response = NextResponse.json({ url, state });

  response.cookies.set("github_link_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
