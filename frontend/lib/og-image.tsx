import { ImageResponse } from "next/og";

// Shared building blocks for dynamic OG images (Satori-compatible JSX only:
// flexbox + absolute positioning, no exotic CSS).

export const OG_W = 1200;
export const OG_H = 630;
export const PAPER = "#c1c0b6";
export const INK = "#1a1a1a";
export const ACCENT = "#1f21b6";
export const SITE = "https://opentip.tech";

type LoadedFont = { name: string; data: ArrayBuffer; weight: 400 | 600 | 700; style: "normal" | "italic" };

// Fraunces (display) + Inter (body/labels) fetched once per render.
// Falls back gracefully: whatever loads is used; Georgia/sans fallbacks
// are declared in every fontFamily stack.
export async function loadOgFonts(): Promise<LoadedFont[]> {
  const css = async (family: string, weights: string) => {
    const res = await fetch(
      `https://fonts.googleapis.com/css2?family=${family}:ital,wght@${weights}&display=swap`,
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } }
    );
    if (!res.ok) throw new Error(`font css ${family}`);
    return res.text();
  };
  const woff2 = async (cssText: string, weight: number, italic: boolean) => {
    // Pick the latin block (last @font-face with U+0000-00FF).
    const blocks = cssText.split("@font-face").slice(1);
    const pick =
      [...blocks].reverse().find((b) => b.includes(`font-weight: ${weight};`) && (italic ? b.includes("font-style: italic;") : !b.includes("font-style: italic;"))) ??
      blocks.find((b) => b.includes(`font-weight: ${weight};`));
    if (!pick) throw new Error("no font block");
    const url = pick.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
    if (!url) throw new Error("no woff2 url");
    const buf = await (await fetch(url)).arrayBuffer();
    return buf;
  };
  const out: LoadedFont[] = [];
  const jobs: Promise<void>[] = [
    (async () => {
      try {
        out.push({ name: "Fraunces", data: await woff2(await css("Fraunces", "0,600;1,600"), 600, false), weight: 600, style: "normal" });
      } catch {}
    })(),
    (async () => {
      try {
        out.push({ name: "Fraunces", data: await woff2(await css("Fraunces", "0,600;1,600"), 600, true), weight: 600, style: "italic" });
      } catch {}
    })(),
    (async () => {
      try {
        out.push({ name: "Inter", data: await woff2(await css("Inter", "0,500;0,700"), 500, false), weight: 400, style: "normal" });
      } catch {}
    })(),
  ];
  await Promise.all(jobs);
  return out;
}

// Fetch any image URL to a data URL for embedding. Relative site paths
// are resolved against the site origin. Null on any failure.
export async function imgToDataUrl(src: string | null | undefined): Promise<string | null> {
  if (!src) return null;
  try {
    const url = src.startsWith("http") ? src : `${SITE}${src.startsWith("/") ? "" : "/"}${src}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "image/png";
    if (!ct.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > 2_000_000) return null;
    return `data:${ct.split(";")[0]};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export function ogResponse(
  element: React.ReactElement,
  fonts: LoadedFont[],
  debugKey: string,
): ImageResponse {
  return new ImageResponse(element, {
    width: OG_W,
    height: OG_H,
    fonts: fonts.length > 0 ? fonts : undefined,
    headers: { "x-og-debug": debugKey },
  });
}

// Shared frame: paper bg, corner ticks, footer strip. Children compose inside.
export function OgFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: OG_W,
        height: OG_H,
        backgroundColor: PAPER,
        color: INK,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px 72px 40px 72px",
        position: "relative",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ position: "absolute", top: 28, left: 32, width: 30, height: 30, borderTop: `3px solid ${INK}`, borderLeft: `3px solid ${INK}`, opacity: 0.5 }} />
      <div style={{ position: "absolute", top: 28, right: 32, width: 30, height: 30, borderTop: `3px solid ${INK}`, borderRight: `3px solid ${INK}`, opacity: 0.5 }} />
      <div style={{ position: "absolute", bottom: 28, left: 32, width: 30, height: 30, borderBottom: `3px solid ${INK}`, borderLeft: `3px solid ${INK}`, opacity: 0.5 }} />
      <div style={{ position: "absolute", bottom: 28, right: 32, width: 30, height: 30, borderBottom: `3px solid ${INK}`, borderRight: `3px solid ${INK}`, opacity: 0.5 }} />
      <div style={{ display: "flex", flexDirection: "column" }}>{children}</div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: `2px solid ${INK}33`,
          paddingTop: 20,
          fontFamily: "Inter, sans-serif",
          fontSize: 24,
          letterSpacing: 4,
          opacity: 0.75,
        }}
      >
        <span>OPENTIP.TECH</span>
        <span style={{ color: ACCENT }}>TIP ANY GITHUB REPO</span>
      </div>
    </div>
  );
}

// Monogram fallback block (initial letter) when no image is available.
export function Monogram({ letter, size = 120 }: { letter: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        backgroundColor: INK,
        color: PAPER,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Fraunces, Georgia, serif",
        fontWeight: 600,
        fontSize: Math.round(size * 0.5),
      }}
    >
      {(letter || "?").slice(0, 1).toUpperCase()}
    </div>
  );
}
