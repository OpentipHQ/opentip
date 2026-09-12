import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const savedState = req.cookies.get("github_link_state")?.value;

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(new URL("/dashboard/account?error=invalid_state", req.url));
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_ID,
        client_secret: process.env.GITHUB_SECRET,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL("/dashboard/account?error=oauth_failed", req.url));
    }

    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    const githubUser = await userRes.json();
    if (!githubUser.id || !githubUser.login) {
      return NextResponse.redirect(new URL("/dashboard/account?error=github_fetch_failed", req.url));
    }

    const userId = session.user.id;
    const githubId = githubUser.id.toString();

    const existingUser = await prisma.user.findUnique({
      where: { githubId },
      select: { id: true },
    });

    if (existingUser && existingUser.id !== userId) {
      return NextResponse.redirect(new URL("/dashboard/account?error=github_taken", req.url));
    }

    const existingAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "github",
          providerAccountId: githubId,
        },
      },
    });

    if (!existingAccount) {
      await prisma.account.create({
        data: {
          userId,
          type: "oauth",
          provider: "github",
          providerAccountId: githubId,
          access_token: tokenData.access_token,
          token_type: tokenData.token_type || "bearer",
          scope: tokenData.scope || "read:user public_repo",
        },
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        githubId,
        login: githubUser.login,
        image: githubUser.avatar_url,
      },
    });

    const response = NextResponse.redirect(new URL("/dashboard/account?linked=github", req.url));
    response.cookies.delete("github_link_state");
    return response;
  } catch (error) {
    console.error("GitHub link callback error:", error);
    return NextResponse.redirect(new URL("/dashboard/account?error=internal", req.url));
  }
}
