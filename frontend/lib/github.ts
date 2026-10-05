export type RepoMeta = {
  full_name: string;
  description: string | null;
  stargazers_count: number;
  owner: { login: string; avatar_url: string };
};

export async function fetchRepoMeta(owner: string, repo: string): Promise<RepoMeta | null> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {},
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  return res.json();
}

export type RepoFiles = {
  readme: string;
  tree: string[];
  files: Record<string, string>;
};

const FILE_PATTERNS = [
  "README.md", "readme.md",
  "package.json", "tsconfig.json", "Cargo.toml", "go.mod", "pyproject.toml",
  "Gemfile", "Makefile", "Dockerfile", "docker-compose.yml", "docker-compose.yaml",
  ".env.example", "setup.py", "setup.cfg", "requirements.txt",
];

const SOURCE_EXTS = [".ts", ".tsx", ".js", ".jsx", ".py", ".rs", ".go", ".rb", ".php", ".swift", ".kt"];

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "\n// ... truncated" : s;
}

export async function fetchRepoFilesForSummary(owner: string, repo: string): Promise<RepoFiles> {
  const ghToken = process.env.GITHUB_TOKEN;
  const branch = "HEAD";

  // Fetch directory tree
  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    ghToken ? { headers: { Authorization: `Bearer ${ghToken}` } } : {}
  );

  let tree: string[] = [];
  if (treeRes.ok) {
    const treeData = await treeRes.json();
    tree = (treeData.tree || [])
      .filter((t: any) => t.type === "blob")
      .map((t: any) => t.path as string);
  }

  // Select files to fetch
  const toFetch: string[] = [];

  // README
  toFetch.push("README.md");

  // Config files that exist in the tree
  for (const pattern of FILE_PATTERNS) {
    if (tree.includes(pattern) && !toFetch.includes(pattern)) {
      toFetch.push(pattern);
    }
  }

  // Top-level source files (max 8)
  const rootSourceFiles = tree
    .filter(p => {
      if (p.includes("/")) return false;
      return SOURCE_EXTS.some(ext => p.endsWith(ext));
    })
    .slice(0, 8);
  for (const f of rootSourceFiles) {
    if (!toFetch.includes(f)) toFetch.push(f);
  }

  // Fetch file contents (max 15 files)
  const files: Record<string, string> = {};
  const fetchQueue = toFetch.slice(0, 15);

  const results = await Promise.allSettled(
    fetchQueue.map(async (path) => {
      const rawRes = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`,
        ghToken ? { headers: { Authorization: `Bearer ${ghToken}` } } : {}
      );
      if (!rawRes.ok) return { path, content: "" };
      const text = await rawRes.text();
      return { path, content: truncate(text, 1500) };
    })
  );

  for (const r of results) {
    if (r.status === "fulfilled" && r.value.content) {
      files[r.value.path] = r.value.content;
    }
  }

  // README fallback — try lowercase or common alternatives
  if (!files["README.md"]) {
    const readmeAlt = tree.find(p => /^readme/i.test(p));
    if (readmeAlt) {
      try {
        const altRes = await fetch(
          `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${readmeAlt}`,
          ghToken ? { headers: { Authorization: `Bearer ${ghToken}` } } : {}
        );
        if (altRes.ok) files[readmeAlt] = truncate(await altRes.text(), 1500);
      } catch {}
    }
  }

  return { readme: files["README.md"] || files[Object.keys(files).find(k => /^readme/i.test(k)) || ""] || "", tree, files };
}
