import Image from "next/image";
import { fetchRepoMeta } from "@/lib/github";
import { prisma } from "@/lib/prisma";
import TipClient from "./TipClient";

export default async function RepoPage({ params }: { params: Promise<{ owner: string; repo: string }> }) {
  const { owner, repo } = await params;
  const repoId = `${owner}/${repo}`;
  const meta = await fetchRepoMeta(owner, repo);

  let developer: { login: string; pfp: string | null; image: string | null } | null = null;
  try {
    const repoRecord = await prisma.repo.findUnique({
      where: { repo_id: repoId.toLowerCase() },
      select: { payout_address: true },
    });
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
    }
  } catch {}

  return (
    <div className="space-y-0">
      <section className="py-12 md:py-16 border-b rule">
        <div className="flex gap-5 items-start">
          {meta ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <Image src={meta.owner.avatar_url} alt={owner} width={56} height={56} className="rounded-sm" />
              <div className="space-y-1">
                <h1 className="serif text-3xl md:text-4xl font-semibold tracking-tight flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>{meta.full_name}</span>
                  {developer && (
                    <a href={`/dev/${developer.login}`} className="inline-flex items-center gap-1.5 group">
                      <span className="text-xs text-zinc-500 group-hover:text-accent transition-colors">
                        by <span className="font-medium text-zinc-700 group-hover:text-accent">{developer.login}</span>
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
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
              <h1 className="serif text-3xl md:text-4xl font-semibold tracking-tight">{repoId}</h1>
              <p className="text-zinc-500 text-sm">Could not fetch GitHub metadata.</p>
            </div>
          )}
        </div>
      </section>

      <TipClient repoId={repoId} />
    </div>
  );
}
