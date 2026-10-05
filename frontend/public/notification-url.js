// Same-origin target for notification clicks. Anything else opens the app root.
export function sameOriginNotificationUrl(raw, origin) {
  let base;
  try {
    base = new URL(origin);
  } catch {
    return "/";
  }
  const fallback = new URL("/", base).href;
  try {
    const input = typeof raw === "string" && raw.trim() ? raw : "/";
    const url = new URL(input, base);
    if (url.origin !== base.origin) return fallback;
    if (url.protocol !== "http:" && url.protocol !== "https:") return fallback;
    return url.href;
  } catch {
    return fallback;
  }
}
