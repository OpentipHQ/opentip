// GitHub's list-repos endpoint accepts per_page 1..100. Anything else is rejected
// so query values are never interpolated into the upstream URL.
const PAGE_MIN = 1;
const PAGE_MAX = 100;
const PER_PAGE_MIN = 1;
const PER_PAGE_MAX = 100;

function parseBound(raw: string, min: number, max: number): number | null {
  if (!/^[0-9]+$/.test(raw)) return null;
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n < min || n > max) return null;
  return n;
}

export function parseGithubRepoPage(
  pageRaw: string | null,
  perPageRaw: string | null,
): { page: number; per_page: number } | { error: string } {
  const page = parseBound(pageRaw ?? "1", PAGE_MIN, PAGE_MAX);
  if (page === null) return { error: "invalid page" };
  const per_page = parseBound(perPageRaw ?? "20", PER_PAGE_MIN, PER_PAGE_MAX);
  if (per_page === null) return { error: "invalid per_page" };
  return { page, per_page };
}
