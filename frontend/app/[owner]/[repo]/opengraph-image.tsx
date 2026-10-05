import { prisma } from "@/lib/prisma";
import { getTokenPrices, usdValue, fmtUsd } from "@/lib/prices";
import { fetchRepoMeta } from "@/lib/github";
import { capitalize } from "@/lib/chain";
import {
  ACCENT,
  Monogram,
  OgFrame,
  imgToDataUrl,
  loadOgFonts,
  ogResponse,
} from "@/lib/og-image";

export const runtime = "nodejs";
export const alt = "Tip this repo on Opentip";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function fmtStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

export default async function Image({
  params,
}: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  const { owner, repo } = await params;
  const repoId = `${owner}/${repo}`;
  const [fonts, record, tips, prices, meta] = await Promise.all([
    loadOgFonts(),
    prisma.repo
      .findUnique({
        where: { repo_id: repoId.toLowerCase() },
        select: { icon: true, hidden: true },
      })
      .catch(() => null),
    prisma.tip
      .groupBy({
        by: ["token"],
        where: { repo_id: repoId.toLowerCase() },
        _sum: { amount: true },
        _count: true,
      })
      .catch(() => []),
    getTokenPrices().catch(() => ({})),
    fetchRepoMeta(owner, repo).catch(() => null),
  ]);

  const totalUsd = tips.reduce((s, t) => s + usdValue(t._sum.amount?.toString() ?? "0", t.token, prices), 0);
  const tipCount = tips.reduce((s, t) => s + (t._count ?? 0), 0);
  const hasTips = tipCount > 0;
  const registered = !!record && !record.hidden;
  const icon = await imgToDataUrl(record?.icon);
  const stars = meta?.stargazers_count ?? null;
  // Project name up front (e.g. "Opentip"), owner kept small for context.
  const projectName = (() => {
    const n = capitalize(repo);
    return n.length > 22 ? `${n.slice(0, 21)}…` : n;
  })();
  const subLine = `${owner} · ${stars !== null ? `${fmtStars(stars)} stars` : "GitHub repo"}${registered ? "" : " · not registered yet"}`;

  const element = (
    <OgFrame>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 28 }}>
        {icon ? (
          <img src={icon} width={120} height={120} style={{ borderRadius: 12 }} />
        ) : (
          <Monogram letter={repo.slice(0, 1)} />
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            style={{
              fontFamily: "Fraunces, Georgia, serif",
              fontWeight: 600,
              fontSize: 76,
              lineHeight: 1,
              letterSpacing: -2,
            }}
          >
            {projectName}
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 26, letterSpacing: 1, opacity: 0.65 }}>
            {subLine}
          </div>
        </div>
      </div>
      {hasTips ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 36 }}>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "baseline", gap: 20 }}>
            <span
              style={{
                fontFamily: "Fraunces, Georgia, serif",
                fontWeight: 600,
                fontSize: 150,
                lineHeight: 1,
                letterSpacing: -3,
              }}
            >
              {fmtUsd(totalUsd)}
            </span>
            <span style={{ fontSize: 64, opacity: 0.7 }}>tipped</span>
          </div>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "baseline", gap: 12, fontSize: 30, opacity: 0.75 }}>
            <span>
              {tipCount} tip{tipCount === 1 ? "" : "s"} ·
            </span>
            <span style={{ color: ACCENT }}>tip this repo on Opentip</span>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 36 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "baseline",
              gap: 16,
              fontFamily: "Fraunces, Georgia, serif",
              fontWeight: 600,
              fontStyle: "italic",
              fontSize: 96,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            <span>Be the first to tip</span>
            <span style={{ color: ACCENT }}>{projectName}</span>
          </div>
          <div style={{ fontSize: 30, opacity: 0.75 }}>from $1, in seconds</div>
        </div>
      )}
    </OgFrame>
  );

  return ogResponse(element, fonts, `repo:${repoId}`);
}
