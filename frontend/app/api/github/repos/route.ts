import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session: any = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  const token = session.accessToken || process.env.GITHUB_TOKEN;
  if (!token) return NextResponse.json({ error: "no github token" }, { status: 400 });
  const page = req.nextUrl.searchParams.get("page") || "1";
  const per_page = req.nextUrl.searchParams.get("per_page") || "20";
  const res = await fetch(`https://api.github.com/user/repos?per_page=${per_page}&page=${page}&sort=updated&affiliation=owner,collaborator`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" },
    next: { revalidate: 60 },
  });
  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: res.status });
  const repos = await res.json();
  // trim to essentials
  const out = repos.map((r:any)=> ({ full_name: r.full_name, name: r.name, owner: r.owner.login, avatar_url: r.owner.avatar_url, description: r.description, stargazers_count: r.stargazers_count, private: r.private }));
  return NextResponse.json(out);
}
