# Production Launch Checklist

Deferred items to complete before mainnet launch.

## Security

- [ ] **Replace in-memory rate limiters with Upstash Redis**
  - `lib/rate-limit.ts` uses `new Map()` — useless on Vercel serverless
  - `app/api/account/password/route.ts` — password change rate limiting
  - `app/api/account/password/reset/request/route.ts` — reset request rate limiting
  - Free tier: 10k commands/day on Upstash

- [ ] **Rotate all secrets** if repo is or has been pushed to a public repository
  - `NEXTAUTH_SECRET`
  - `GITHUB_SECRET`
  - `PRIVATE_KEY`
  - `REGISTRAR_PRIVATE_KEY`
  - `RESEND_API_KEY`
  - `AZURE_STORAGE_KEY`

## Deployment

- [ ] **Deploy contract on Base mainnet**
  - Update `NEXT_PUBLIC_BASE_CONTRACT` in Vercel env vars
  - Update `NEXT_PUBLIC_CHAIN=base`
  - Remove `NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT` from production env
  - Update `OWNER_ADDRESS` and `REGISTRAR_PRIVATE_KEY` if rotating keys

- [ ] **Set all Vercel environment variables**
  - `NEXTAUTH_URL=https://opentip.tech`
  - `NEXTAUTH_SECRET`
  - `DATABASE_URL` (with `?sslmode=require`)
  - `GITHUB_ID` and `GITHUB_SECRET`
  - `PRIVATE_KEY` and `REGISTRAR_PRIVATE_KEY`
  - `OWNER_ADDRESS` and `NEXT_PUBLIC_OWNER_ADDRESS`
  - `NEXT_PUBLIC_BASE_CONTRACT`
  - `NEXT_PUBLIC_CHAIN=base`
  - `RESEND_API_KEY` and `RESEND_FROM`
  - `AZURE_STORAGE_ACCOUNT` and `AZURE_STORAGE_KEY`
  - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

- [ ] **Add `engines` field to `package.json`** (nice-to-have)
  ```json
  "engines": { "node": ">=20" }
  ```

## Infrastructure

- [ ] **Set up Upstash Redis** for rate limiting
  - Create account at upstash.com
  - Create a Redis instance
  - Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to Vercel env vars
  - Install `@upstash/ratelimit` and `@upstash/redis`

## Completed (Testnet Phase)

- [x] Fix PrismaClient instances — all 11 files use singleton
- [x] Add `postinstall` script for Prisma generate
- [x] Remove `console.log(quote)` from TipClient
- [x] Fix leaderboard — direct DB query instead of self-fetch
- [x] Replace localhost fallbacks with `https://opentip.tech`
- [x] Add `NEXT_PUBLIC_OWNER_ADDRESS` to `.env`
