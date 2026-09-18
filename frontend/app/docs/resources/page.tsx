export const metadata = {
  title: "Resources",
  description: "All Opentip links — contract, explorer, GitHub, social media, and community resources.",
};

export default function ResourcesPage() {
  return (
    <div className="space-y-16">
      <section className="space-y-4">
        <h1 className="serif text-4xl font-semibold tracking-tight">Resources</h1>
        <p className="text-lg text-zinc-600">
          Every link you need — contracts, explorers, repos, and community.
        </p>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Smart Contract</h2>
        <div className="space-y-3">
          <a href="https://basescan.org/address/0xA45Be472a64eE6Daa093c6a975Cd8908C615d594" target="_blank" rel="noopener noreferrer" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium text-sm">Base (Mainnet)</h3>
            <code className="block mt-2 font-mono text-xs text-zinc-500 break-all">0xA45Be472a64eE6Daa093c6a975Cd8908C615d594</code>
            <p className="text-sm text-accent mt-1">View on Basescan →</p>
          </a>
          <a href="https://sepolia.basescan.org/address/0xed13db8234d437771e115419bf7498ddef90dc8d" target="_blank" rel="noopener noreferrer" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium text-sm">Base Sepolia (Testnet)</h3>
            <code className="block mt-2 font-mono text-xs text-zinc-500 break-all">0xeD13dB8234d437771e115419BF7498Ddef90Dc8D</code>
            <p className="text-sm text-accent mt-1">View on Basescan →</p>
          </a>
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">GitHub</h2>
        <div className="space-y-3">
          <a href="https://github.com/opentiphq" target="_blank" rel="noopener noreferrer" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium text-sm">Opentip Organization</h3>
            <p className="text-sm text-zinc-600 mt-1">All repositories, issues, and source code.</p>
            <p className="text-sm text-accent mt-1">github.com/opentiphq →</p>
          </a>
          <a href="https://github.com/opentiphq/opentip" target="_blank" rel="noopener noreferrer" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium text-sm">Main Repository</h3>
            <p className="text-sm text-zinc-600 mt-1">Monorepo with frontend, indexer, and contracts.</p>
            <p className="text-sm text-accent mt-1">github.com/opentiphq/opentip →</p>
          </a>
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Social</h2>
        <div className="space-y-3">
          <a href="https://x.com/opentip_tech" target="_blank" rel="noopener noreferrer" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium text-sm">Twitter / X</h3>
            <p className="text-sm text-zinc-600 mt-1">Updates, announcements, and community.</p>
            <p className="text-sm text-accent mt-1">x.com/opentip_tech →</p>
          </a>
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Chain</h2>
        <div className="space-y-3">
          <a href="https://base.org" target="_blank" rel="noopener noreferrer" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium text-sm">Base</h3>
            <p className="text-sm text-zinc-600 mt-1">The L2 network Opentip is built on.</p>
            <p className="text-sm text-accent mt-1">base.org →</p>
          </a>
          <a href="https://sepolia.basescan.org" target="_blank" rel="noopener noreferrer" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium text-sm">Base Sepolia Explorer</h3>
            <p className="text-sm text-zinc-600 mt-1">Block explorer for the testnet.</p>
            <p className="text-sm text-accent mt-1">sepolia.basescan.org →</p>
          </a>
          <a href="https://basescan.org" target="_blank" rel="noopener noreferrer" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium text-sm">Base Mainnet Explorer</h3>
            <p className="text-sm text-zinc-600 mt-1">Block explorer for mainnet.</p>
            <p className="text-sm text-accent mt-1">basescan.org →</p>
          </a>
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Integrations</h2>
        <div className="space-y-3">
          <a href="https://groq.com" target="_blank" rel="noopener noreferrer" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium text-sm">Groq</h3>
            <p className="text-sm text-zinc-600 mt-1">Powers AI-generated repository summaries.</p>
            <p className="text-sm text-accent mt-1">groq.com →</p>
          </a>
          <a href="https://reown.com" target="_blank" rel="noopener noreferrer" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium text-sm">Reown (WalletConnect)</h3>
            <p className="text-sm text-zinc-600 mt-1">Wallet connection modal used by Opentip.</p>
            <p className="text-sm text-accent mt-1">reown.com →</p>
          </a>
          <a href="https://openzeppelin.com" target="_blank" rel="noopener noreferrer" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium text-sm">OpenZeppelin</h3>
            <p className="text-sm text-zinc-600 mt-1">Smart contract libraries (Ownable, Pausable, ReentrancyGuard, EIP712).</p>
            <p className="text-sm text-accent mt-1">openzeppelin.com →</p>
          </a>
          <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium text-sm">Resend</h3>
            <p className="text-sm text-zinc-600 mt-1">Transactional email service (password reset).</p>
            <p className="text-sm text-accent mt-1">resend.com →</p>
          </a>
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Docs</h2>
        <div className="space-y-3">
          <a href="/docs/getting-started" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium text-sm">Getting Started</h3>
            <p className="text-sm text-zinc-600 mt-1">How to tip a repository.</p>
          </a>
          <a href="/docs/for-developers" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium text-sm">For Developers</h3>
            <p className="text-sm text-zinc-600 mt-1">Register repos, claim tips, set up your profile.</p>
          </a>
          <a href="/docs/smart-contract" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium text-sm">Smart Contract</h3>
            <p className="text-sm text-zinc-600 mt-1">Full on-chain reference.</p>
          </a>
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Legal</h2>
        <div className="space-y-3">
          <a href="/legal/terms" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium text-sm">Terms of Service</h3>
            <p className="text-sm text-zinc-600 mt-1">Usage terms and limitations.</p>
          </a>
          <a href="/legal/privacy" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium text-sm">Privacy Policy</h3>
            <p className="text-sm text-zinc-600 mt-1">How we collect, use, and protect your data.</p>
          </a>
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Contact</h2>
        <div className="p-6 border rule rounded-sm">
          <p className="text-sm text-zinc-500 uppercase tracking-wider mb-2">Email</p>
          <a href="mailto:support@opentip.tech" className="text-xl font-mono text-accent hover:underline underline-offset-4">
            support@opentip.tech
          </a>
        </div>
      </section>
    </div>
  );
}
