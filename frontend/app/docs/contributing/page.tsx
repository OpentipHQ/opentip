export const metadata = {
  title: "Contributing",
  description: "Self-host Opentip, run the development environment, or contribute to the codebase.",
};

function CodeBlock({ children }: { children: string }) {
  return (
    <code className="block bg-zinc-900 text-zinc-100 p-4 rounded-sm font-mono text-sm overflow-x-auto">
      {children}
    </code>
  );
}

export default function ContributingPage() {
  return (
    <div className="space-y-16">
      <section className="space-y-4">
        <h1 className="serif text-4xl font-semibold tracking-tight">Contributing</h1>
        <p className="text-lg text-zinc-600">
          Run Opentip locally, self-host, or contribute to the open-source codebase.
        </p>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Prerequisites</h2>
        <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
          <li>Node.js 20 or later</li>
          <li>npm (workspaces)</li>
          <li>PostgreSQL database (local or cloud)</li>
          <li>Foundry (for smart contract development)</li>
          <li>Git</li>
        </ul>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Clone & install</h2>
        <CodeBlock>{`git clone https://github.com/opentiphq/opentip.git
cd opentip
npm install`}</CodeBlock>
        <p className="text-sm text-zinc-700 leading-relaxed">
          This installs dependencies for both the frontend and indexer via npm workspaces.
        </p>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Environment variables</h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          Copy the example env file and fill in your values:
        </p>
        <CodeBlock>{`cd frontend
cp .env.example .env`}</CodeBlock>

        <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Frontend variables</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b rule">
                <th className="text-left py-3 pr-4 font-medium">Variable</th>
                <th className="text-left py-3 pr-4 font-medium">Required</th>
                <th className="text-left py-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b rule">
                <td className="py-3 pr-4 font-mono text-xs text-accent">DATABASE_URL</td>
                <td className="py-3 pr-4">Yes</td>
                <td className="py-3 text-zinc-600">PostgreSQL connection string</td>
              </tr>
              <tr className="border-b rule">
                <td className="py-3 pr-4 font-mono text-xs text-accent">GITHUB_ID</td>
                <td className="py-3 pr-4">Yes</td>
                <td className="py-3 text-zinc-600">GitHub OAuth app client ID</td>
              </tr>
              <tr className="border-b rule">
                <td className="py-3 pr-4 font-mono text-xs text-accent">GITHUB_SECRET</td>
                <td className="py-3 pr-4">Yes</td>
                <td className="py-3 text-zinc-600">GitHub OAuth app client secret</td>
              </tr>
              <tr className="border-b rule">
                <td className="py-3 pr-4 font-mono text-xs text-accent">NEXTAUTH_SECRET</td>
                <td className="py-3 pr-4">Yes</td>
                <td className="py-3 text-zinc-600">Session encryption key (random string)</td>
              </tr>
              <tr className="border-b rule">
                <td className="py-3 pr-4 font-mono text-xs text-accent">NEXTAUTH_URL</td>
                <td className="py-3 pr-4">Yes</td>
                <td className="py-3 text-zinc-600">Base URL (http://localhost:3000 for dev)</td>
              </tr>
              <tr className="border-b rule">
                <td className="py-3 pr-4 font-mono text-xs text-accent">NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID</td>
                <td className="py-3 pr-4">Yes</td>
                <td className="py-3 text-zinc-600">Reown/WalletConnect project ID</td>
              </tr>
              <tr className="border-b rule">
                <td className="py-3 pr-4 font-mono text-xs text-accent">NEXT_PUBLIC_CHAIN</td>
                <td className="py-3 pr-4">Yes</td>
                <td className="py-3 text-zinc-600">baseSepolia or base</td>
              </tr>
              <tr className="border-b rule">
                <td className="py-3 pr-4 font-mono text-xs text-accent">NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT</td>
                <td className="py-3 pr-4">Yes</td>
                <td className="py-3 text-zinc-600">Contract address on Base Sepolia</td>
              </tr>
              <tr className="border-b rule">
                <td className="py-3 pr-4 font-mono text-xs text-accent">NEXT_PUBLIC_BASE_CONTRACT</td>
                <td className="py-3 pr-4">For mainnet</td>
                <td className="py-3 text-zinc-600">Contract address on Base mainnet</td>
              </tr>
              <tr className="border-b rule">
                <td className="py-3 pr-4 font-mono text-xs text-accent">PRIVATE_KEY</td>
                <td className="py-3 pr-4">Yes</td>
                <td className="py-3 text-zinc-600">Owner wallet private key (admin transactions)</td>
              </tr>
              <tr className="border-b rule">
                <td className="py-3 pr-4 font-mono text-xs text-accent">REGISTRAR_PRIVATE_KEY</td>
                <td className="py-3 pr-4">Yes</td>
                <td className="py-3 text-zinc-600">Registrar signer key (EIP-712 registration)</td>
              </tr>
              <tr className="border-b rule">
                <td className="py-3 pr-4 font-mono text-xs text-accent">OWNER_ADDRESS</td>
                <td className="py-3 pr-4">Yes</td>
                <td className="py-3 text-zinc-600">Owner wallet address (admin role check)</td>
              </tr>
              <tr className="border-b rule">
                <td className="py-3 pr-4 font-mono text-xs text-accent">NEXT_PUBLIC_OWNER_ADDRESS</td>
                <td className="py-3 pr-4">Yes</td>
                <td className="py-3 text-zinc-600">Owner address (client-side)</td>
              </tr>
              <tr className="border-b rule">
                <td className="py-3 pr-4 font-mono text-xs text-accent">RESEND_API_KEY</td>
                <td className="py-3 pr-4">Optional</td>
                <td className="py-3 text-zinc-600">Resend API key (password reset emails)</td>
              </tr>
              <tr className="border-b rule">
                <td className="py-3 pr-4 font-mono text-xs text-accent">RESEND_FROM</td>
                <td className="py-3 pr-4">Optional</td>
                <td className="py-3 text-zinc-600">From address for emails</td>
              </tr>
              <tr className="border-b rule">
                <td className="py-3 pr-4 font-mono text-xs text-accent">AZURE_STORAGE_ACCOUNT</td>
                <td className="py-3 pr-4">Optional</td>
                <td className="py-3 text-zinc-600">Azure Blob Storage account (image uploads)</td>
              </tr>
              <tr className="border-b rule">
                <td className="py-3 pr-4 font-mono text-xs text-accent">AZURE_STORAGE_KEY</td>
                <td className="py-3 pr-4">Optional</td>
                <td className="py-3 text-zinc-600">Azure Blob Storage key</td>
              </tr>
              <tr className="border-b rule">
                <td className="py-3 pr-4 font-mono text-xs text-accent">GROQ_API_KEY</td>
                <td className="py-3 pr-4">Optional</td>
                <td className="py-3 text-zinc-600">Groq API key (AI-generated repo summaries)</td>
              </tr>
              <tr className="border-b rule">
                <td className="py-3 pr-4 font-mono text-xs text-accent">GITHUB_TOKEN</td>
                <td className="py-3 pr-4">Optional</td>
                <td className="py-3 text-zinc-600">GitHub token (higher API rate limits)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mt-6">Indexer variables</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b rule">
                <th className="text-left py-3 pr-4 font-medium">Variable</th>
                <th className="text-left py-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b rule">
                <td className="py-3 pr-4 font-mono text-xs text-accent">DATABASE_URL</td>
                <td className="py-3 text-zinc-600">Same PostgreSQL connection as frontend</td>
              </tr>
              <tr className="border-b rule">
                <td className="py-3 pr-4 font-mono text-xs text-accent">CONTRACT_ADDRESS</td>
                <td className="py-3 text-zinc-600">Deployed Opentip contract address</td>
              </tr>
              <tr className="border-b rule">
                <td className="py-3 pr-4 font-mono text-xs text-accent">RPC_URL</td>
                <td className="py-3 text-zinc-600">Base RPC endpoint</td>
              </tr>
              <tr className="border-b rule">
                <td className="py-3 pr-4 font-mono text-xs text-accent">START_BLOCK</td>
                <td className="py-3 text-zinc-600">Block to start scanning from (if no checkpoint)</td>
              </tr>
              <tr className="border-b rule">
                <td className="py-3 pr-4 font-mono text-xs text-accent">POLL_MS</td>
                <td className="py-3 text-zinc-600">Poll interval in ms (default 12000)</td>
              </tr>
              <tr className="border-b rule">
                <td className="py-3 pr-4 font-mono text-xs text-accent">NEXT_PUBLIC_CHAIN</td>
                <td className="py-3 text-zinc-600">baseSepolia or base</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Database setup</h2>
        <CodeBlock>{`cd frontend
npx prisma migrate dev
npx prisma generate`}</CodeBlock>
        <p className="text-sm text-zinc-700 leading-relaxed">
          This creates all tables in your PostgreSQL database. The Prisma schema is shared between the frontend and indexer.
        </p>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Running locally</h2>
        <div className="space-y-4">
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Frontend</h3>
            <CodeBlock>{`cd frontend
npm run dev`}</CodeBlock>
            <p className="text-sm text-zinc-600 mt-2">Starts the Next.js dev server at http://localhost:3000</p>
          </div>
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Indexer</h3>
            <CodeBlock>{`cd indexer
npx prisma generate
npx tsx src/index.ts`}</CodeBlock>
            <p className="text-sm text-zinc-600 mt-2">Starts the event indexer polling loop</p>
          </div>
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Smart contract development</h2>
        <CodeBlock>{`cd contracts
forge install
forge test`}</CodeBlock>
        <p className="text-sm text-zinc-700 leading-relaxed">
          The contract has 36 tests covering registration, tipping, claiming, admin functions, and edge cases. Run <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">forge test -vvv</code> for verbose output.
        </p>
        <p className="text-sm text-zinc-700 leading-relaxed">
          Deploy to Base Sepolia:
        </p>
        <CodeBlock>{`forge script script/Deploy.s.sol:Deploy \\
  --rpc-url baseSepolia \\
  --broadcast \\
  --verify`}</CodeBlock>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Testing checklist</h2>
        <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
          <li>Sign up with GitHub and email/password</li>
          <li>Link a wallet on Base Sepolia</li>
          <li>Register a repo (verify ownership → sign → on-chain tx)</li>
          <li>Send a USDC tip (approve + receiveTip)</li>
          <li>Send an ETH tip (payable receiveTipEth)</li>
          <li>Send an OAR tip (approve + receiveTip)</li>
          <li>Claim tips as the payout address holder</li>
          <li>Set a display name</li>
          <li>Edit profile (bio, social links, pfp, header)</li>
          <li>Test forgot password flow</li>
          <li>View AI-generated repo summary on About tab</li>
          <li>Add/edit links on dashboard repos page</li>
          <li>Browse repos, activity, leaderboard pages</li>
          <li>Admin: pause/unpause, set fee, manage admins</li>
        </ul>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Production deployment</h2>
        <div className="space-y-3">
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Frontend (Vercel)</h3>
            <ul className="text-sm text-zinc-600 mt-2 space-y-1 list-disc pl-5">
              <li>Set all 19 environment variables in Vercel dashboard</li>
              <li>Set NEXTAUTH_URL to your production domain</li>
              <li>Deploy from the main branch</li>
            </ul>
          </div>
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Indexer (Azure Container Apps)</h3>
            <ul className="text-sm text-zinc-600 mt-2 space-y-1 list-disc pl-5">
              <li>Build Docker image from the indexer directory</li>
              <li>Push to a container registry</li>
              <li>Deploy to Azure Container Apps with the 6 env vars</li>
            </ul>
          </div>
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Contract (Base mainnet)</h3>
            <ul className="text-sm text-zinc-600 mt-2 space-y-1 list-disc pl-5">
              <li>Deploy via Foundry with mainnet RPC</li>
              <li>Verify on Basescan</li>
              <li>Update all env vars to mainnet addresses</li>
              <li>Update NEXT_PUBLIC_CHAIN to &quot;base&quot;</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">License</h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          Opentip is open-source software. The smart contract is MIT licensed. See the repository for full license details.
        </p>
      </section>
    </div>
  );
}
