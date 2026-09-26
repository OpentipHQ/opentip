import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimit, rateLimitKey, RateLimitError } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Same-origin relay for Coinbase CDP API traffic.
// Why: api.cdp.coinbase.com is IP-geoblocked in some regions — browsers there
// get Failed to fetch with no VPN. Our server (Vercel, allowed region) forwards
// the calls, so blocked users work without VPN. Auth model unchanged: end-user
// session tokens only, no secrets involved. Wallet calls are infrequent (KBs).
//
// Served under /platform/* via a Next rewrite (see next.config.js): the CDP SDK
// exempts bootstrap calls from session auth with start-anchored path regexes
// (^(\/platform)?\/v2\/...), so the browser-visible path MUST start with
// /platform. Do not point the SDK basePath at /api/cdp/* — auth dies locally.
const UPSTREAM = "https://api.cdp.coinbase.com/platform";
const MAX_BODY_BYTES = 1024 * 1024; // 1 MB

const HOP_HEADERS = new Set([
  "host",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-length",
]);

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  // 1. Logged-in users only — every CDP flow already requires this.
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  // 2. Rate limit so this can't be abused as an open relay.
  try {
    rateLimit(rateLimitKey(req, "cdp-proxy"), "write");
  } catch (e) {
    if (e instanceof RateLimitError) {
      return NextResponse.json(
        { error: e.message },
        { status: 429, headers: { "Retry-After": String(e.retryAfter) } }
      );
    }
    throw e;
  }

  // 3. Fixed upstream — user path can only append underneath it.
  const { path } = await ctx.params;
  const clean = (path || []).filter((s) => s && s !== "." && s !== "..");
  const search = req.nextUrl.search || "";
  if (search.length > 2048) {
    return NextResponse.json({ error: "query too long" }, { status: 414 });
  }
  const url = `${UPSTREAM}/${clean.map(encodeURIComponent).join("/")}${search}`;

  // 4. Forward auth/content headers. Never leak our session cookies upstream.
  const headers = new Headers();
  req.headers.forEach((v, k) => {
    const lk = k.toLowerCase();
    if (lk === "cookie" || HOP_HEADERS.has(lk)) return;
    headers.set(k, v);
  });

  // 5. Body with size cap.
  let body: ArrayBuffer | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const buf = await req.arrayBuffer();
    if (buf.byteLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "request too large" }, { status: 413 });
    }
    body = buf;
  }

  // 6. Forward with timeout (short — wallet calls are small JSON).
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  let upstream: Response;
  try {
    upstream = await fetch(url, { method: req.method, headers, body, signal: ctrl.signal });
  } catch (e: any) {
    clearTimeout(timer);
    return NextResponse.json({ error: "CDP unreachable from server" }, { status: 502 });
  }
  clearTimeout(timer);

  // 7. Stream the upstream response back. Never pass through upstream cookies,
  // and map upstream failures to a generic 502 to avoid leaking CDP internals.
  // Strip content-encoding/content-length so Next.js/Vercel re-enciphers
  // fresh — the upstream sends gzip but Vercel also compresses NextResponse,
  // causing double-compression and net::ERR_CONTENT_DECODING_FAILED in the browser.
  if (upstream.status >= 500) {
    return NextResponse.json({ error: "CDP request failed" }, { status: 502 });
  }
  const resHeaders = new Headers();
  upstream.headers.forEach((v, k) => {
    const lk = k.toLowerCase();
    if (!HOP_HEADERS.has(lk) && lk !== "set-cookie" && lk !== "content-encoding" && lk !== "content-length") resHeaders.set(k, v);
  });
  return new NextResponse(upstream.body, { status: upstream.status, headers: resHeaders });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
