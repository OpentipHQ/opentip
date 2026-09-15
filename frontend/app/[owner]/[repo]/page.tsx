import Image from "next/image";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { fetchRepoMeta } from "@/lib/github";
import { prisma } from "@/lib/prisma";
import { generateRepoSummary } from "@/lib/ai";
import RepoTabs from "./RepoTabs";

type Link = { title: string; url: string };

async function getOrCreateSummary(repoId: string, owner: string, repo: string) {
  try {
    const existing = await prisma.repo.findUnique({
      where: { repo_id: repoId.toLowerCase() },
      select: { summary: true, summary_generated_at: true },
    });

    if (existing?.summary && existing.summary_generated_at) {
      const age = Date.now() - existing.summary_generated_at.getTime();
      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
      if (age < SEVEN_DAYS) {
        return JSON.parse(existing.summary);
      }
    }

    const summary = await generateRepoSummary(owner, repo);

    await prisma.repo.update({
      where: { repo_id: repoId.toLowerCase() },
      data: {
        summary: JSON.stringify(summary),
        summary_generated_at: new Date(),
      },
    }).catch(() => {});

    return summary;
  } catch {
    return null;
  }
}

async function getLinks(repoId: string): Promise<Link[]> {
  try {
    const repo = await prisma.repo.findUnique({
      where: { repo_id: repoId.toLowerCase() },
      select: { links: true },
    });
    if (repo?.links) return JSON.parse(repo.links);
  } catch {}
  return [];
}

export default async function RepoPage({ params }: { params: Promise<{ owner: string; repo: string }> }) {
  const { owner, repo } = await params;
  const repoId = `${owner}/${repo}`;
  const meta = await fetchRepoMeta(owner, repo);

  let developer: { login: string; pfp: string | null; image: string | null } | null = null;
  let summary = null;
  let links: Link[] = [];

  try {
    const repoRecord = await prisma.repo.findUnique({
      where: { repo_id: repoId.toLowerCase() },
      select: { payout_address: true, hidden: true },
    });
    if (!repoRecord || repoRecord.hidden) notFound();
    if (repoRecord) {
      const wallet = await prisma.userWallet.findUnique({
        where: { address: repoRecord.payout_address },
        select: {
          user: {
            select: { login: true, pfp: true, image: true },
          },
        },
      });
      if (wallet?.user?.login) {
        developer = { login: wallet.user.login, pfp: wallet.user.pfp, image: wallet.user.image };
      }

      // Fetch or generate summary + links in parallel
      const [s, l] = await Promise.all([
        getOrCreateSummary(repoId, owner, repo),
        getLinks(repoId),
      ]);
      summary = s;
      links = l;
    }
  } catch {}

  return (
    <div className="space-y-0">
      <section className="py-12 md:py-16 border-b rule">
        <div className="flex flex-wrap gap-5 items-start">
          {meta ? (
            <>
              <Image src={meta.owner.avatar_url} alt={owner} width={56} height={56} className="rounded-sm" />
              <div className="space-y-1">
                <h1 className="serif fluid-heading font-semibold tracking-tight flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>{meta.full_name}</span>
                  {developer && (
                    <a href={`/dev/${developer.login}`} className="inline-flex items-center gap-1.5 group">
                      <span className="text-xs text-zinc-500 group-hover:text-accent transition-colors">
                        by <span className="font-medium text-zinc-700 group-hover:text-accent">{developer.login}</span>
                      </span>
                      <img
                        src={developer.pfp || developer.image || `https://avatars.githubusercontent.com/${developer.login}`}
                        alt={developer.login}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                    </a>
                  )}
                </h1>
                {meta.description && <p className="text-zinc-600 text-sm leading-relaxed">{meta.description}</p>}
                <p className="text-xs text-zinc-500">★ {meta.stargazers_count}</p>
              </div>
            </>
          ) : (
            <div className="space-y-1">
              <h1 className="serif fluid-heading font-semibold tracking-tight">{repoId}</h1>
              <p className="text-zinc-500 text-sm">Could not fetch GitHub metadata.</p>
            </div>
          )}
        </div>
      </section>

      <Suspense fallback={<div className="py-12 text-center text-sm text-zinc-500">Loading...</div>}>
        <RepoTabs repoId={repoId} summary={summary} links={links} />
      </Suspense>
    </div>
  );
}
