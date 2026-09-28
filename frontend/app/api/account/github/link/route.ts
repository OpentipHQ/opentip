import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const state = randomBytes(16).toString("hex");
  const clientId = process.env.GITHUB_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL || "https://opentip.tech"}/api/account/github/callback`;

  // Optional return path (e.g. onboarding passes { next: "/onboarding?next=..." }).
  // Strictly internal paths only — never external URLs.
  let next: string | null = null;
  try {
    const body = await req.json();
    if (typeof body?.next === "string" && body.next.startsWith("/") && !body.next.startsWith("//")) {
      next = body.next;
    }
  } catch { /* empty body — existing callers send none */ }

  if (!clientId) {
    return NextResponse.json({ error: "GitHub OAuth not configured" }, { status: 500 });
  }

  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=read%3Auser+public_repo&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  const response = NextResponse.json({ url });

  response.cookies.set("github_link_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  if (next) {
    response.cookies.set("github_link_next", next, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
  }

  return response;
}
