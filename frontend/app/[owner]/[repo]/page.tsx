import { fetchRepoMeta } from "@/lib/github";
import TipClient from "./TipClient";

export default async function RepoPage({ params }: { params: Promise<{ owner: string; repo: string }> }) {
  const { owner, repo } = await params;
  const repoId = `${owner}/${repo}`;
  const meta = await fetchRepoMeta(owner, repo);

  return (
    <div className="space-y-0">
      <section className="py-12 md:py-16 border-b rule">
        <div className="flex gap-5 items-start">
          {meta ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={meta.owner.avatar_url} alt={owner} width={56} height={56} className="rounded-sm" />
              <div className="space-y-1">
                <h1 className="serif text-3xl md:text-4xl font-semibold tracking-tight">{meta.full_name}</h1>
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

      <TipClient repoId={repoId} owner={owner} repo={repo} />
    </div>
  );
}
