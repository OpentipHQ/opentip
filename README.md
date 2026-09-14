# Opentip

The open-source tip jar on Base. Send crypto to the developers who build the tools you use every day.

**[opentip.tech](https://opentip.tech)** · **[GitHub](https://github.com/opentiphq)** · **[X / Twitter](https://x.com/opentip_tech)** · **[support@opentip.tech](mailto:support@opentip.tech)**

---

## How it works

1. **Find a repo** — browse registered repositories on Opentip
2. **Change one word in the URL** — replace `github.com` with `opentip.tech` (or visit directly)
3. **Send a tip** — pay in USDC or ETH (ETH is swapped to USDC offchain via [Relay](https://relay.link))
4. **Developer claims** — the repo owner sets a payout address and pulls funds on-chain

Opentip takes a **5% fee** on each tip to keep the platform running. **95% goes directly to the developer.** Minimum tip is $1 to prevent gas fees from eating small amounts.

---

## Features

- **Repo-level tipping** — tips are tied to a specific GitHub repository
- **USDC and ETH** — pay with either currency; ETH is converted to USDC via Relay before reaching the contract
- **Pull payments** — developers set a payout address and claim when ready
- **AI-generated summaries** — Groq-powered codebase analysis displayed on each repo page
- **Developer profiles** — public profiles with stats, contribution heatmaps, and social links
- **Admin dashboard** — contract controls, fee management, treasury, user management
- **GitHub OAuth** — sign in with GitHub to verify repo ownership
- **Email/password auth** — optional email signup with password reset via Resend
- **Leaderboard** — top supporters ranked by lifetime USDC tipped
- **Profile customization** — upload profile picture and header image via Azure Blob Storage

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Smart contract | Solidity 0.8.26, OpenZeppelin, Foundry |
| Frontend | Next.js 16, React 19, Tailwind CSS, TypeScript |
| Auth | NextAuth.js, GitHub OAuth, JWT |
| Database | PostgreSQL (Azure), Prisma ORM |
| Wallet | Reown AppKit (WalletConnect), wagmi, viem |
| Indexer | Standalone Node.js, polls Base every 12s (Azure Container Apps) |
| AI summaries | Groq API (openai/gpt-oss-20b) |
| Image uploads | Azure Blob Storage |
| Transaction routing | Relay API v2 |
| Email | Resend |
| Hosting | Vercel (frontend), Azure Container Apps (indexer) |

---

## Project structure

```
opentip/
├── contracts/          Solidity smart contract + Foundry tests
│   ├── src/Opentip.sol
│   ├── test/
│   └── script/Deploy.s.sol
├── frontend/           Next.js app (deployed to Vercel)
│   ├── app/            Pages, API routes, layouts
│   │   ├── [owner]/[repo]/   Public repo page (tip form + AI summary)
│   │   ├── admin/            Admin dashboard (owner-only controls)
│   │   ├── dashboard/        User dashboard (repos, account, profile)
│   │   ├── dev/[login]/      Public developer profile
│   │   ├── docs/             Documentation site (9 pages)
│   │   ├── api/              REST API routes
│   │   └── legal/            Terms of Service, Privacy Policy
│   ├── components/     Shared UI components
│   ├── lib/            Utilities (chain config, auth, contracts, AI, email)
│   └── prisma/         Database schema
├── indexer/            Event indexer (polls contract, syncs to DB)
└── package.json        npm workspaces root
```

---

## Quick start

### Prerequisites

- Node.js 20+
- [Foundry](https://book.getfoundry.sh/) (for contracts)
- PostgreSQL database

### 1. Clone & install

```bash
git clone https://github.com/opentiphq/opentip.git
cd opentip
npm install
```

### 2. Smart contract (Foundry)

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts --no-commit
forge test -vvv

# Deploy to Base Sepolia
cp .env.example .env   # fill in PRIVATE_KEY, BASE_SEPOLIA_RPC, ETHERSCAN_API_KEY
forge script script/Deploy.s.sol:Deploy --rpc-url $BASE_SEPOLIA_RPC --broadcast --verify
```

The contract is deployed and verified on Base Sepolia:
- **Contract:** [`0xeD13dB8234d437771e115419BF7498Ddef90Dc8D`](https://sepolia.basescan.org/address/0xed13db8234d437771e115419bf7498ddef90dc8d)
- **USDC (testnet):** `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

### 3. Database

```bash
# Set DATABASE_URL in frontend/.env and indexer/.env
cd indexer && npx prisma migrate dev --name init
cd ../frontend && npx prisma generate
```

### 4. Indexer

```bash
cd indexer
cp .env.example .env   # fill in DATABASE_URL, RPC_URL, CONTRACT_ADDRESS
npm run dev
```

The indexer polls the contract every 12 seconds and syncs events to PostgreSQL.

### 5. Frontend

```bash
cd frontend
cp .env.example .env   # fill in all required env vars (see below)
npm run dev            # http://localhost:3000
```

---

## Environment variables

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (`?sslmode=require`) |
| `GITHUB_ID` | GitHub OAuth app client ID |
| `GITHUB_SECRET` | GitHub OAuth app client secret |
| `NEXTAUTH_SECRET` | Random string for JWT signing |
| `NEXTAUTH_URL` | `http://localhost:3000` (dev) or `https://opentip.tech` (prod) |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Reown/WalletConnect project ID |
| `NEXT_PUBLIC_CHAIN` | `baseSepolia` (testnet) or `base` (mainnet) |
| `NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT` | Testnet contract address |
| `NEXT_PUBLIC_BASE_CONTRACT` | Mainnet contract address |
| `NEXT_PUBLIC_RELAY_API_KEY` | Relay API key for ETH→USDC swaps |
| `GROQ_API_KEY` | Groq API key for AI-generated repo summaries |
| `RESEND_API_KEY` | Resend API key (password reset emails) |
| `AZURE_STORAGE_ACCOUNT` | Azure Blob Storage account name |
| `AZURE_STORAGE_KEY` | Azure Blob Storage access key |

### Indexer (`indexer/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `RPC_URL` | Base RPC endpoint |
| `CONTRACT_ADDRESS` | Deployed Opentip contract address |
| `START_BLOCK` | Block number to start indexing from |
| `POLL_MS` | Polling interval (default: 12000ms) |

---

## Architecture

### Smart contract (`Opentip.sol`)

The on-chain contract handles:
- **Repo registration** — EIP-712 signed registration with GitHub ownership verification
- **Tip receiving** — USDC tips credited to the repo's pending balance
- **Payout claims** — pull-payment pattern; developers set an address and claim
- **Fee collection** — 5% fee routed to the treasury on each tip
- **Admin controls** — pause/unpause, fee adjustment, treasury and registrar key rotation

Key properties:
- `Ownable2Step` — two-step ownership transfer for security
- `Pausable` — emergency stop mechanism
- `ReentrancyGuard` — prevents reentrancy attacks
- `EIP-712` — typed structured data for off-chain signature verification

### Indexer

A standalone Node.js service that:
- Polls the contract for `TipReceived`, `RepoRegistered`, `Claimed`, and `TreasuryWithdrawn` events
- Syncs event data to PostgreSQL
- Runs on Azure Container Apps on a consumption plan (~$8-10/month)

### Frontend

Next.js 16 app with:
- **App Router** — file-based routing with layouts
- **Server Components** — DB queries in server components (leaderboard, repo pages)
- **Turbopack** — fast dev server and builds
- **Fluid responsive design** — CSS `clamp()` for typography and spacing, flexbox for layouts
- **Chain-driven config** — single `lib/chain.ts` module controls all chain-specific values

---

## Deployment

### Vercel (frontend)

1. Connect your GitHub repo to Vercel
2. Set all environment variables in the Vercel dashboard
3. Deploy — `npm run build` runs automatically

### Azure Container Apps (indexer)

```bash
cd indexer
az containerapp up \
  --source . \
  --env-vars DATABASE_URL=... CONTRACT_ADDRESS=... RPC_URL=... \
  --resource-group opentip \
  --environment opentip-env
```

### Mainnet launch checklist

- [ ] Deploy contract on Base mainnet
- [ ] Set `NEXT_PUBLIC_CHAIN=base`
- [ ] Set `NEXT_PUBLIC_BASE_CONTRACT` to mainnet address
- [ ] Rotate all secrets if repo was public
- [ ] Replace in-memory rate limiters with Upstash Redis
- [ ] Set `NEXTAUTH_URL=https://opentip.tech`

---

## Contributing

See [CONTRIBUTING.md](frontend/app/docs/contributing/page.tsx) or visit [opentip.tech/docs/contributing](https://opentip.tech/docs/contributing) for setup instructions, code conventions, and PR guidelines.

---

## License

MIT

---

## Links

- **Website:** [opentip.tech](https://opentip.tech)
- **GitHub:** [github.com/opentiphq](https://github.com/opentiphq)
- **X / Twitter:** [@opentip_tech](https://x.com/opentip_tech)
- **Email:** [support@opentip.tech](mailto:support@opentip.tech)
- **Contract (testnet):** [Basescan](https://sepolia.basescan.org/address/0xed13db8234d437771e115419bf7498ddef90dc8d)
