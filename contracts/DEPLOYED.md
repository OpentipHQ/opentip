# Opentip Deployments

## Base Sepolia (84532) — Testnet
- **Contract:** `0xeD13dB8234d437771e115419BF7498Ddef90Dc8D`
- **Tx:** `0x27b45703a014e3b16756243b4a46d3127ada2b34003ba903887dc0c168b165c4`
- **Block:** 46720275
- **USDC:** `0x036CbD53842c5426634e7929541eC2318f3dCF7e` (Circle faucet)
- **Owner/Deployer:** `0x4950A3333eE2577360d1b022952BB325F362542F`
- **Registrar Signer:** `0xbe615CDD9cc49a7620b9F77d8ED957DC442d3fD9`
- **Treasury:** `0x4950A3333eE2577360d1b022952BB325F362542F`
- **feeBps:** 500 (5%)
- **Basescan:** https://sepolia.basescan.org/address/0xed13db8234d437771e115419bf7498ddef90dc8d

### Env wiring
- `frontend/.env` → `NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT=0xeD13dB8234d437771e115419BF7498Ddef90Dc8D`
- `frontend/.env` → `OWNER_ADDRESS=0x4950A3333eE2577360d1b022952BB325F362542F`
- `frontend/.env` → `REGISTRAR_PRIVATE_KEY=<private key for 0xbe615CDD9cc49a7620b9F77d8ED957DC442d3fD9>`

### Verification
```
forge verify-contract 0x5b73C5498c1E3b4dbA84de0F1833c4a029d90519 src/Opentip.sol:Opentip --chain 84532 --watch
```

## Base Mainnet (8453) — Production
- **Contract:** `0xA45Be472a64eE6Daa093c6a975Cd8908C615d594`
- **USDC:** `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **Owner/Deployer:** `0x4950A3333eE2577360d1b022952BB325F362542F`
- **Registrar Signer:** `0xbe615CDD9cc49a7620b9F77d8ED957DC442d3fD9`
- **Treasury:** `0x4950A3333eE2577360d1b022952BB325F362542F`
- **feeBps:** 500 (5%)
- **Basescan:** https://basescan.org/address/0xA45Be472a64eE6Daa093c6a975Cd8908C615d594

### Env wiring
- `frontend/.env` → `NEXT_PUBLIC_CHAIN=base`
- `frontend/.env` → `NEXT_PUBLIC_BASE_CONTRACT=0xA45Be472a64eE6Daa093c6a975Cd8908C615d594`
- `indexer/.env` → `NEXT_PUBLIC_CHAIN=base`
- `indexer/.env` → `CONTRACT_ADDRESS=0xA45Be472a64eE6Daa093c6a975Cd8908C615d594`
