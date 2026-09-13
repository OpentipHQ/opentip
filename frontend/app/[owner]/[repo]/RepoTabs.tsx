"use client";

import { useSearchParams, useRouter } from "next/navigation";
import type { RepoSummary } from "@/lib/ai";
import TipClient from "./TipClient";

type Link = { title: string; url: string };

export default function RepoTabs({
  repoId,
  summary,
  links,
}: {
  repoId: string;
  summary: RepoSummary | null;
  links: Link[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") === "about" ? "about" : "tip";

  function setTab(tab: string) {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    router.push(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b rule">
        <button
          onClick={() => setTab("tip")}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "tip"
              ? "border-zinc-900 text-zinc-900"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Tip
        </button>
        <button
          onClick={() => setTab("about")}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "about"
              ? "border-zinc-900 text-zinc-900"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          About
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "tip" ? (
        <TipClient repoId={repoId} />
      ) : (
        <div className="py-8 space-y-8">
          {/* AI Summary */}
          {summary ? (
            <section className="space-y-4">
              <h2 className="serif text-xl font-semibold">About this project</h2>
              <p className="text-sm text-zinc-700 leading-relaxed">{summary.description}</p>

              {summary.techStack.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Tech stack</h3>
                  <div className="flex flex-wrap gap-2">
                    {summary.techStack.map((tech) => (
                      <span key={tech} className="px-2.5 py-1 bg-zinc-900/5 text-xs rounded-sm">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {summary.features.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Features</h3>
                  <ul className="text-sm text-zinc-600 space-y-1 list-disc pl-5">
                    {summary.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.audience && (
                <p className="text-xs text-zinc-500">Built for: {summary.audience}</p>
              )}
            </section>
          ) : (
            <section className="space-y-2">
              <h2 className="serif text-xl font-semibold">About this project</h2>
              <p className="text-sm text-zinc-500">No summary available yet.</p>
            </section>
          )}

          {/* Links */}
          {links.length > 0 && (
            <section className="space-y-3 border-t rule pt-6">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Links</h3>
              <ul className="space-y-2">
                {links.map((link, i) => (
                  <li key={i}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-zinc-700 hover:text-accent underline underline-offset-4 transition-colors"
                    >
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
