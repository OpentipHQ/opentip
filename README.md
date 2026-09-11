# Opentip — open-source tip jar on Base

Base Sepolia testnet first, Base mainnet after full E2E. Repo-level tips in ETH/USDC → held as USDC, pull payments, 5% fee.

## Quick start

### 1. Contracts (Foundry)
```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts --no-commit
forge test -vvv
# set .env then deploy
forge script script/Deploy.s.sol:Deploy --rpc-url $BASE_SEPOLIA_RPC --broadcast --verify
```

### 2. DB (Azure Database for PostgreSQL Flexible Server)
```bash
# set DATABASE_URL in .env (also in indexer/.env and frontend/.env)
cd indexer && npx prisma migrate dev --name init
cd ../frontend && npx prisma generate
```

### 3. Indexer (Azure Container Apps)
```bash
cd indexer
npm install
# set RPC_URL, CONTRACT_ADDRESS, DATABASE_URL
npm run dev
# Docker deploy: az containerapp up --source . --env-vars DATABASE_URL=... CONTRACT_ADDRESS=...
```

### 4. Frontend (Vercel Hobby)
```bash
cd frontend
npm install
npm run dev  # http://localhost:3000
# set env: DATABASE_URL, GITHUB_ID/SECRET, NEXTAUTH_SECRET, NEXT_PUBLIC_* etc.
```

## Env
See `.env.example` at repo root.

## Testing checklist (Base Sepolia)
- [ ] Register repo (GitHub OAuth → verify-ownership → registerRepo)
- [ ] Tip in USDC directly
- [ ] Tip in ETH via Relay swap path
- [ ] Reject tip < $1
- [ ] Claim as payoutAddress
- [ ] withdrawTreasury as owner
- [ ] Events fire: RepoRegistered, TipReceived, Claimed, TreasuryWithdrawn
- [ ] Slither before mainnet
- [ ] Verify on Basescan

## Out of scope (v2)
Cross-chain, private repos, per-commit tipping, gasless claims, unclaimed-funds policy, badges/NFTs (events already preserve tipper history), Relay revenue share, multisig treasury (setTreasuryAddress → Safe).
