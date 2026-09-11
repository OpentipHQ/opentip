import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const repoId = req.nextUrl.searchParams.get("repoId");
  if (!repoId || !repoId.includes("/")) return NextResponse.json({ error: "repoId required as owner/repo" }, { status: 400 });

  const session: any = await getServerSession(authOptions);
  const login = session?.user?.login;
  const accessToken = (session as any)?.accessToken;

  // Instead, use GitHub API with the user's OAuth token stored in session — NextAuth stores it in jwt
  // Simpler: require client to pass session and we verify via GitHub API using the stored token
  // For now, if no login, return unauthenticated
  if (!login) return NextResponse.json({ error: "not authenticated", owns: false }, { status: 401 });

  const [owner, repo] = repoId.split("/");

  // Verify ownership via GitHub API (public)
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: { Accept: "application/vnd.github.v3+json" },
  });
  if (!repoRes.ok) return NextResponse.json({ owns: false, reason: "repo not found" });
  const repoJson: any = await repoRes.json();

  // owner check
  if (repoJson.owner?.login?.toLowerCase() === login.toLowerCase()) {
    return NextResponse.json({ owns: true, via: "owner" });
  }

  // collaborator check — requires auth token with public_repo scope; use server-side token if available
  const token = process.env.GITHUB_TOKEN || accessToken;
  if (token) {
    const collabRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/collaborators/${login}/permission`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" },
    });
    if (collabRes.ok) {
      const j: any = await collabRes.json();
      if (["admin", "write"].includes(j.permission)) return NextResponse.json({ owns: true, via: j.permission });
    }
  }

  return NextResponse.json({ owns: false, via: "none" });
}
