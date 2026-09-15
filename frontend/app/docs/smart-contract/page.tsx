export const metadata = {
  title: "Smart Contract",
  description: "Full reference for the Opentip smart contract — functions, events, fee structure, and security model.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t rule pt-10 space-y-6">
      <h2 className="serif text-2xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function FuncTable({ rows }: { rows: { name: string; params: string; returns: string; modifier: string; description: string }[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b rule">
            <th className="text-left py-3 pr-4 font-medium">Function</th>
            <th className="text-left py-3 pr-4 font-medium">Parameters</th>
            <th className="text-left py-3 pr-4 font-medium">Returns</th>
            <th className="text-left py-3 pr-4 font-medium">Modifier</th>
            <th className="text-left py-3 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b rule last:border-0">
              <td className="py-3 pr-4 font-mono text-xs text-accent">{r.name}</td>
              <td className="py-3 pr-4 font-mono text-xs text-zinc-600">{r.params}</td>
              <td className="py-3 pr-4 font-mono text-xs text-zinc-600">{r.returns}</td>
              <td className="py-3 pr-4 font-mono text-xs text-zinc-500">{r.modifier}</td>
              <td className="py-3 text-zinc-600">{r.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EventTable({ rows }: { rows: { name: string; params: string; description: string }[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b rule">
            <th className="text-left py-3 pr-4 font-medium">Event</th>
            <th className="text-left py-3 pr-4 font-medium">Parameters</th>
            <th className="text-left py-3 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b rule last:border-0">
              <td className="py-3 pr-4 font-mono text-xs text-accent">{r.name}</td>
              <td className="py-3 pr-4 font-mono text-xs text-zinc-600">{r.params}</td>
              <td className="py-3 text-zinc-600">{r.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SmartContractPage() {
  return (
    <div className="space-y-16">
      <section className="space-y-4">
        <h1 className="serif text-4xl font-semibold tracking-tight">Smart Contract</h1>
        <p className="text-lg text-zinc-600">
          The on-chain component of Opentip. Written in Solidity, deployed on Base.
        </p>
      </section>

      <Section title="Deployment">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rule rounded-sm">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Testnet (Base Sepolia)</p>
              <code className="block mt-2 font-mono text-sm break-all">0xeD13dB8234d437771e115419BF7498Ddef90Dc8D</code>
              <a href="https://sepolia.basescan.org/address/0xed13db8234d437771e115419bf7498ddef90dc8d" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-xs text-accent underline underline-offset-4">Basescan →</a>
            </div>
            <div className="p-4 border rule rounded-sm">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Mainnet (Base)</p>
              <code className="block mt-2 font-mono text-sm break-all">0xA45Be472a64eE6Daa093c6a975Cd8908C615d594</code>
              <a href="https://basescan.org/address/0xA45Be472a64eE6Daa093c6a975Cd8908C615d594" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-xs text-accent underline underline-offset-4">Basescan →</a>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-zinc-500">Solidity</p>
              <p className="font-mono text-sm">^0.8.26</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">License</p>
              <p className="font-mono text-sm">MIT</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Lines</p>
              <p className="font-mono text-sm">298</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">USDC (Testnet)</p>
              <code className="font-mono text-xs break-all">0x036CbD53842c5426634e7929541eC2318f3dCF7e</code>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Inheritance">
        <p className="text-sm text-zinc-700">The contract inherits from four OpenZeppelin libraries:</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 border rule rounded-sm">
            <p className="font-medium text-sm">Ownable2Step</p>
            <p className="text-xs text-zinc-600 mt-1">Two-step ownership transfer for safety</p>
          </div>
          <div className="p-3 border rule rounded-sm">
            <p className="font-medium text-sm">Pausable</p>
            <p className="text-xs text-zinc-600 mt-1">Emergency pause/unpause mechanism</p>
          </div>
          <div className="p-3 border rule rounded-sm">
            <p className="font-medium text-sm">ReentrancyGuard</p>
            <p className="text-xs text-zinc-600 mt-1">Protection against reentrancy attacks</p>
          </div>
          <div className="p-3 border rule rounded-sm">
            <p className="font-medium text-sm">EIP712</p>
            <p className="text-xs text-zinc-600 mt-1">Off-chain typed signature verification</p>
          </div>
        </div>
      </Section>

      <Section title="Constants">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b rule">
                <th className="text-left py-3 pr-4 font-medium">Constant</th>
                <th className="text-left py-3 pr-4 font-medium">Value</th>
                <th className="text-left py-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b rule">
                <td className="py-3 pr-4 font-mono text-xs text-accent">MIN_TIP</td>
                <td className="py-3 pr-4 font-mono text-xs">1e6</td>
                <td className="py-3 text-zinc-600">Minimum tip: 1 USDC ($1)</td>
              </tr>
              <tr className="border-b rule">
                <td className="py-3 pr-4 font-mono text-xs text-accent">MAX_FEE_BPS</td>
                <td className="py-3 pr-4 font-mono text-xs">1000</td>
                <td className="py-3 text-zinc-600">Maximum fee: 10%</td>
              </tr>
              <tr className="border-b rule">
                <td className="py-3 pr-4 font-mono text-xs text-accent">MAX_REPO_ID_LENGTH</td>
                <td className="py-3 pr-4 font-mono text-xs">200</td>
                <td className="py-3 text-zinc-600">Maximum characters for a repo ID</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Functions">
        <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">User Functions</h3>
        <FuncTable rows={[
          { name: "registerRepo", params: "repoId, payoutAddress, expiry, nonce, signature", returns: "—", modifier: "whenNotPaused", description: "Register a repo with an EIP-712 signed permit. Validates format, expiry, and signature." },
          { name: "updatePayoutAddress", params: "repoId, newAddress", returns: "—", modifier: "whenNotPaused", description: "Rotate the payout wallet for a registered repo. Only callable by current payout address." },
          { name: "receiveTip", params: "repoId, usdcAmount", returns: "—", modifier: "nonReentrant, whenNotPaused", description: "Accept a USDC tip. Pulls USDC from msg.sender, splits fee, credits pending balance." },
          { name: "claim", params: "repoId", returns: "—", modifier: "nonReentrant, whenNotPaused", description: "Withdraw all pending USDC for a repo. Only callable by the payout address." },
        ]} />

        <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mt-8">Admin Functions</h3>
        <FuncTable rows={[
          { name: "pause", params: "—", returns: "—", modifier: "onlyOwner", description: "Emergency pause. Blocks register, update, tip, and claim." },
          { name: "unpause", params: "—", returns: "—", modifier: "onlyOwner", description: "Resume operations after a pause." },
          { name: "setFeeBps", params: "newFeeBps", returns: "—", modifier: "onlyOwner", description: "Update platform fee. Capped at MAX_FEE_BPS (1000 = 10%)." },
          { name: "setTreasuryAddress", params: "newTreasury", returns: "—", modifier: "onlyOwner", description: "Change the treasury address. Migratable to Gnosis Safe." },
          { name: "withdrawTreasury", params: "amount", returns: "—", modifier: "onlyOwner, nonReentrant", description: "Withdraw accumulated fees to the treasury address." },
          { name: "setRegistrarSigner", params: "newSigner", returns: "—", modifier: "onlyOwner", description: "Rotate the EIP-712 registrar signer. Old key is immediately invalidated." },
          { name: "adminReassignPayout", params: "repoId, newAddress", returns: "—", modifier: "onlyOwner", description: "Emergency recovery: reassign payout address if wallet key is lost." },
        ]} />

        <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mt-8">View Functions</h3>
        <FuncTable rows={[
          { name: "getPendingBalance", params: "repoId", returns: "uint256", modifier: "view", description: "USDC available to claim for a repo." },
          { name: "getPayoutAddress", params: "repoId", returns: "address", modifier: "view", description: "The wallet that can claim tips for a repo." },
          { name: "getTotalTipped", params: "repoId", returns: "uint256", modifier: "view", description: "Lifetime gross tip amount for a repo." },
          { name: "getTotalTipCount", params: "repoId", returns: "uint256", modifier: "view", description: "Lifetime tip count for a repo." },
          { name: "getFeeBps", params: "—", returns: "uint256", modifier: "view", description: "Current platform fee in basis points." },
          { name: "getTreasuryBalance", params: "—", returns: "uint256", modifier: "view", description: "Accumulated unwithdrawn fees." },
          { name: "isRegistered", params: "repoId", returns: "bool", modifier: "view", description: "Whether a repo has been registered." },
        ]} />
      </Section>

      <Section title="Events">
        <EventTable rows={[
          { name: "RepoRegistered", params: "repoId, payoutAddress (indexed), timestamp", description: "Emitted when a new repo is registered." },
          { name: "PayoutAddressUpdated", params: "repoId, oldAddress, newAddress (indexed)", description: "Emitted when a payout wallet is rotated." },
          { name: "TipReceived", params: "tipper (indexed), repoId, usdcAmount, feeAmount, timestamp", description: "Emitted on every tip." },
          { name: "Claimed", params: "payoutAddress (indexed), repoId, amount, timestamp", description: "Emitted when a developer claims tips." },
          { name: "TreasuryWithdrawn", params: "to (indexed), amount, timestamp", description: "Emitted when treasury funds are withdrawn." },
          { name: "FeeUpdated", params: "oldFeeBps, newFeeBps", description: "Emitted when the platform fee changes." },
          { name: "TreasuryAddressUpdated", params: "oldTreasury (indexed), newTreasury (indexed)", description: "Emitted when the treasury address changes." },
          { name: "RegistrarSignerUpdated", params: "oldSigner (indexed), newSigner (indexed)", description: "Emitted when the registrar signer is rotated." },
          { name: "AdminPayoutReassigned", params: "repoId, oldAddress, newAddress, admin (indexed)", description: "Emitted when an admin reassigns a payout address." },
        ]} />
      </Section>

      <Section title="Fee Structure">
        <div className="space-y-4">
          <p className="text-sm text-zinc-700 leading-relaxed">
            The platform fee is expressed in basis points (bps). 500 bps = 5%. The fee is capped at 1000 bps (10%) and enforced in both the constructor and <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">setFeeBps</code>.
          </p>
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">How fees flow</h3>
            <ol className="text-sm text-zinc-600 mt-2 space-y-1 list-decimal pl-5">
              <li>Tipper sends USDC via <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">receiveTip()</code></li>
              <li>Fee = <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">usdcAmount * feeBps / 10000</code></li>
              <li>Fee credited to <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">treasuryBalance</code></li>
              <li>Net amount (usdcAmount - fee) credited to repo&apos;s <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">pendingBalance</code></li>
              <li>Developer calls <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">claim()</code> to withdraw their share</li>
              <li>Owner calls <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">withdrawTreasury()</code> to collect fees</li>
            </ol>
          </div>
        </div>
      </Section>

      <Section title="Registration Flow">
        <div className="space-y-4">
          <p className="text-sm text-zinc-700 leading-relaxed">
            Registration uses EIP-712 typed signatures to prevent squatting. The process:
          </p>
          <ol className="text-sm text-zinc-700 space-y-2 list-decimal pl-5">
            <li>Server verifies GitHub ownership (owner or write collaborator)</li>
            <li>Server signs a <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">Register</code> typed struct with the registrar key</li>
            <li>User submits the signature on-chain via <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">registerRepo()</code></li>
            <li>Contract verifies the registrar signer matches, stores the repo</li>
          </ol>
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Repo ID validation rules</h3>
            <ul className="text-sm text-zinc-600 mt-2 space-y-1 list-disc pl-5">
              <li>Must be lowercase (no uppercase A-Z)</li>
              <li>Must contain exactly one <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">/</code> separator</li>
              <li>Minimum 3 characters, maximum 200</li>
              <li>No leading or trailing <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">/</code></li>
              <li>Must not be already registered</li>
            </ul>
          </div>
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">EIP-712 domain</h3>
            <code className="block mt-2 bg-zinc-900 text-zinc-100 p-3 rounded-sm font-mono text-xs">
{`{
  name: "Opentip",
  version: "1",
  chainId: 8453,
  verifyingContract: "0xA45Be472a64eE6Daa093c6a975Cd8908C615d594"
}`}
            </code>
          </div>
        </div>
      </Section>

      <Section title="Security Properties">
        <div className="space-y-3">
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Reentrancy protection</h3>
            <p className="text-sm text-zinc-600 mt-1">All state-changing external functions (<code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">receiveTip</code>, <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">claim</code>, <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">withdrawTreasury</code>) use <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">nonReentrant</code>.</p>
          </div>
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Pausable</h3>
            <p className="text-sm text-zinc-600 mt-1">The owner can pause the contract in an emergency. Paused contract blocks registration, tip updates, tips, and claims.</p>
          </div>
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Two-step ownership</h3>
            <p className="text-sm text-zinc-600 mt-1">Uses Ownable2Step — ownership transfer requires the new owner to accept. Prevents accidental transfer to a wrong address.</p>
          </div>
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Checks-effects-interactions</h3>
            <p className="text-sm text-zinc-600 mt-1">All functions update state before making external calls (USDC transfers), following the CEI pattern.</p>
          </div>
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Minimum tip enforcement</h3>
            <p className="text-sm text-zinc-600 mt-1">The contract rejects tips below 1 USDC (<code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">MIN_TIP = 1e6</code>) to prevent dust attacks.</p>
          </div>
        </div>
      </Section>

      <section className="border-t rule pt-10">
        <h2 className="serif text-2xl font-semibold mb-4">Source code</h2>
        <p className="text-sm text-zinc-700">
          The full contract source is available at <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">contracts/src/Opentip.sol</code> in the repository.
        </p>
        <a href="https://github.com/opentiphq" target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-sm text-accent underline underline-offset-4">
          View on GitHub →
        </a>
      </section>
    </div>
  );
}
