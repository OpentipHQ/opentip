import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const owner = req.nextUrl.searchParams.get("owner");
  const repo = req.nextUrl.searchParams.get("repo");
  if (!owner || !repo) return NextResponse.json({ error: "owner and repo required" }, { status: 400 });
  if (!/^[a-zA-Z0-9._-]+$/.test(owner) || !/^[a-zA-Z0-9._-]+$/.test(repo)) {
    return NextResponse.json({ error: "invalid owner or repo" }, { status: 400 });
  }

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {},
    next: { revalidate: 300 },
  });

  if (!res.ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  const data = await res.json();
  return NextResponse.json({
    full_name: data.full_name,
    name: data.name,
    description: data.description,
    stargazers_count: data.stargazers_count,
    forks_count: data.forks_count,
    language: data.language,
    topics: data.topics,
    html_url: data.html_url,
    homepage: data.homepage,
    owner: data.owner ? { login: data.owner.login, avatar_url: data.owner.avatar_url } : null,
  });
}
