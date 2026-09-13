export const metadata = {
  title: "API Reference",
  description: "REST API endpoints for repos, tips, profiles, accounts, and admin operations.",
};

function Endpoint({ method, path, description, params }: { method: string; path: string; description: string; params?: { name: string; type: string; description: string; required?: boolean }[] }) {
  const color = method === "GET" ? "text-emerald-700 bg-emerald-50" : method === "POST" ? "text-amber-700 bg-amber-50" : "text-red-700 bg-red-50";
  return (
    <div className="p-4 border rule rounded-sm space-y-2">
      <div className="flex items-center gap-3">
        <span className={`px-2 py-0.5 rounded-sm text-xs font-mono font-medium ${color}`}>{method}</span>
        <code className="font-mono text-sm">{path}</code>
      </div>
      <p className="text-sm text-zinc-600">{description}</p>
      {params && params.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Parameters</p>
          <div className="space-y-1">
            {params.map((p) => (
              <div key={p.name} className="flex items-start gap-2 text-sm">
                <code className="font-mono text-xs text-accent">{p.name}</code>
                <span className="text-xs text-zinc-500">{p.type}</span>
                {p.required && <span className="text-xs text-red-600">required</span>}
                <span className="text-zinc-600">— {p.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApiPage() {
  return (
    <div className="space-y-16">
      <section className="space-y-4">
        <h1 className="serif text-4xl font-semibold tracking-tight">API Reference</h1>
        <p className="text-lg text-zinc-600">
          REST endpoints for building on top of Opentip. All endpoints return JSON.
        </p>
      </section>

      <section className="border-t rule pt-10 space-y-4">
        <h2 className="serif text-2xl font-semibold">Authentication</h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          Most endpoints require an authenticated session via NextAuth. The session cookie (<code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">next-auth.session-token</code>) must be included in requests. Admin endpoints additionally require a linked wallet matching an admin address.
        </p>
        <p className="text-sm text-zinc-700 leading-relaxed">
          Public endpoints (repos, tips, leaderboard, stats, profile) do not require authentication.
        </p>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Repos</h2>
        <div className="space-y-3">
          <Endpoint
            method="GET"
            path="/api/repos"
            description="Paginated list of registered repos. Returns GitHub metadata (avatar, description, stars) when available."
            params={[
              { name: "page", type: "number", description: "Page number (default 1)" },
              { name: "limit", type: "number", description: "Results per page (default 20)" },
              { name: "sort", type: "string", description: "Sort by: tipped, recent, tips" },
              { name: "q", type: "string", description: "Search by repo name" },
            ]}
          />
          <Endpoint
            method="GET"
            path="/api/registered-repos"
            description="Repos registered by the current user (through their linked wallets). Requires authentication."
          />
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Tips</h2>
        <div className="space-y-3">
          <Endpoint
            method="GET"
            path="/api/tips"
            description="Paginated list of tips. Returns display names when set."
            params={[
              { name: "page", type: "number", description: "Page number (default 1)" },
              { name: "limit", type: "number", description: "Results per page (default 20)" },
              { name: "repoId", type: "string", description: "Filter by repo ID (e.g. owner/repo)" },
            ]}
          />
          <Endpoint
            method="GET"
            path="/api/leaderboard"
            description="Top 20 tippers by lifetime USDC amount. Raw SQL aggregation."
            params={[
              { name: "repoId", type: "string", description: "Filter by repo ID" },
            ]}
          />
          <Endpoint
            method="GET"
            path="/api/stats"
            description="Global platform statistics: total volume, total tips, developers paid."
          />
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Profile</h2>
        <div className="space-y-3">
          <Endpoint
            method="GET"
            path="/api/dev/[login]"
            description="Public profile data for a developer by GitHub login. Returns name, image, bio, social links, repos, and stats."
          />
          <Endpoint
            method="POST"
            path="/api/dev/profile"
            description="Save or update developer profile (bio + 6 social links). Requires authentication."
          />
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Wallet</h2>
        <div className="space-y-3">
          <Endpoint
            method="GET"
            path="/api/wallet/link"
            description="List all wallets linked to the current user. Requires authentication."
          />
          <Endpoint
            method="POST"
            path="/api/wallet/link"
            description="Link a wallet. Verifies Ethereum signature. Requires authentication."
            params={[
              { name: "address", type: "string", description: "Ethereum address", required: true },
              { name: "signature", type: "string", description: "Signed message", required: true },
              { name: "nonce", type: "string", description: "Random nonce", required: true },
            ]}
          />
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Display Name</h2>
        <div className="space-y-3">
          <Endpoint
            method="GET"
            path="/api/display-name"
            description="Get display name for a wallet address."
            params={[
              { name: "address", type: "string", description: "Ethereum address", required: true },
            ]}
          />
          <Endpoint
            method="POST"
            path="/api/display-name"
            description="Set a display name for your wallet. Requires signature verification."
            params={[
              { name: "address", type: "string", description: "Ethereum address", required: true },
              { name: "name", type: "string", description: "Display name (1-64 chars)", required: true },
              { name: "signature", type: "string", description: "Signed message", required: true },
            ]}
          />
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Uploads</h2>
        <div className="space-y-3">
          <Endpoint
            method="POST"
            path="/api/upload/pfp"
            description="Upload profile picture. Max 2MB. JPEG, PNG, WebP, or GIF. Stored in Azure Blob Storage. Requires authentication."
          />
          <Endpoint
            method="POST"
            path="/api/upload/header"
            description="Upload header banner. Max 4MB. Same formats. Stored in Azure Blob Storage. Requires authentication."
          />
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Ownership Verification</h2>
        <div className="space-y-3">
          <Endpoint
            method="POST"
            path="/api/verify-ownership"
            description="Verifies GitHub repo ownership (owner or admin/write collaborator). Signs an EIP-712 registration permit. Returns signature, expiry, nonce. Requires authentication."
            params={[
              { name: "repoId", type: "string", description: "Repo ID (e.g. owner/repo)", required: true },
              { name: "payoutAddress", type: "string", description: "Payout wallet address", required: true },
            ]}
          />
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Account</h2>
        <div className="space-y-3">
          <Endpoint
            method="GET"
            path="/api/account/status"
            description="Returns account state: hasGithub, hasEmail, hasPassword, pfp, header, email, githubLogin. Requires authentication."
          />
          <Endpoint
            method="POST"
            path="/api/account/email"
            description="Add email to account (one-time, cannot be changed after set). Requires authentication."
          />
          <Endpoint
            method="POST"
            path="/api/account/password"
            description="Set or change password. Rate-limited to 5 attempts per 15 minutes. Requires authentication."
          />
          <Endpoint
            method="POST"
            path="/api/account/password/reset/request"
            description="Generate reset token and send email via Resend."
            params={[
              { name: "email", type: "string", description: "Account email", required: true },
            ]}
          />
          <Endpoint
            method="POST"
            path="/api/account/password/reset/confirm"
            description="Validate token and set new password."
            params={[
              { name: "token", type: "string", description: "Reset token from email", required: true },
              { name: "password", type: "string", description: "New password (min 8 chars)", required: true },
            ]}
          />
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">GitHub</h2>
        <div className="space-y-3">
          <Endpoint
            method="GET"
            path="/api/github/repos"
            description="Proxied GitHub API: fetch user's repos (owner + collaborator) with access token. Requires authentication."
          />
          <Endpoint
            method="GET"
            path="/api/github/meta"
            description="Fetch public GitHub repo metadata (owner, description, stars). Cached 5 minutes. Public."
            params={[
              { name: "owner", type: "string", description: "GitHub owner", required: true },
              { name: "repo", type: "string", description: "GitHub repo name", required: true },
            ]}
          />
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Auth</h2>
        <div className="space-y-3">
          <Endpoint
            method="POST"
            path="/api/auth/signup"
            description="Register a new email/password account. Minimum 8 characters. Passwords hashed with bcrypt."
            params={[
              { name: "email", type: "string", description: "Email address", required: true },
              { name: "password", type: "string", description: "Password (min 8 chars)", required: true },
              { name: "name", type: "string", description: "Display name (optional)" },
            ]}
          />
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Admin</h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          All admin endpoints require an authenticated session with a linked wallet matching an admin or owner address. Owner-only endpoints require the owner wallet.
        </p>
        <div className="space-y-3">
          <Endpoint
            method="GET"
            path="/api/admin/me"
            description="Returns current admin's role and wallet address."
          />
          <Endpoint
            method="GET"
            path="/api/admin/stats"
            description="Full stats: totalTips, totalFees, treasuryBalance, totalRepos, totalUsers, recentTips."
          />
          <Endpoint
            method="GET"
            path="/api/admin/repos"
            description="All registered repos with payout addresses, tip counts, and balances."
          />
          <Endpoint
            method="GET"
            path="/api/admin/users"
            description="All users with wallets, tip counts, and totals."
          />
          <Endpoint
            method="GET"
            path="/api/admin/tips"
            description="Paginated tips with Basescan links. 50 per page."
          />
          <Endpoint
            method="GET"
            path="/api/admin/admins"
            description="List all admin records."
          />
          <Endpoint
            method="POST"
            path="/api/admin/admins"
            description="Add an admin. Owner only."
            params={[
              { name: "address", type: "string", description: "Wallet address", required: true },
              { name: "role", type: "string", description: "Role: admin or viewer", required: true },
            ]}
          />
          <Endpoint
            method="DELETE"
            path="/api/admin/admins/[address]"
            description="Remove an admin. Owner only."
          />
          <Endpoint method="POST" path="/api/admin/pause" description="Pause the smart contract. Owner only." />
          <Endpoint method="POST" path="/api/admin/unpause" description="Unpause the smart contract. Owner only." />
          <Endpoint
            method="POST"
            path="/api/admin/set-fee"
            description="Update fee basis points on-chain. Owner only."
            params={[{ name: "feeBps", type: "number", description: "New fee (0-1000)", required: true }]}
          />
          <Endpoint
            method="POST"
            path="/api/admin/set-treasury"
            description="Update treasury address on-chain. Owner only."
            params={[{ name: "address", type: "string", description: "New treasury address", required: true }]}
          />
          <Endpoint
            method="POST"
            path="/api/admin/set-registrar"
            description="Rotate registrar signer on-chain. Owner only."
            params={[{ name: "signer", type: "string", description: "New signer address", required: true }]}
          />
          <Endpoint
            method="POST"
            path="/api/admin/reassign"
            description="Reassign payout address for a repo. Owner only."
            params={[
              { name: "repoId", type: "string", description: "Repo ID", required: true },
              { name: "newAddress", type: "string", description: "New payout address", required: true },
            ]}
          />
          <Endpoint
            method="POST"
            path="/api/admin/withdraw"
            description="Withdraw treasury funds on-chain. Owner only."
            params={[{ name: "amount", type: "string", description: "Amount in USDC base units", required: true }]}
          />
        </div>
      </section>
    </div>
  );
}
