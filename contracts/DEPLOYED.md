# Opentip Deployments

## Base Sepolia (84532) — Testnet
- **Contract:** `0xA45Be472a64eE6Daa093c6a975Cd8908C615d594`
- **Tx:** `0x528e95f5f7550051b7bc4b2ab9263d1708262c9ecba98cf39fdf4ca52dcdcbcc`
- **Block:** 46676254
- **USDC:** `0x036CbD53842c5426634e7929541eC2318f3dCF7e` (Circle faucet)
- **Deployer/Owner/Treasury:** `0x4950A3333eE2577360d1b022952BB325F362542F`
- **feeBps:** 500 (5%)
- **Basescan:** https://sepolia.basescan.org/address/0xA45Be472a64eE6Daa093c6a975Cd8908C615d594

### Env wiring
- `frontend/.env` → `NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT=0xA45Be472a64eE6Daa093c6a975Cd8908C615d594`
- `indexer/.env` → `CONTRACT_ADDRESS=0xA45Be472a64eE6Daa093c6a975Cd8908C615d594` + `RPC_URL=https://sepolia.base.org`

### Verification
Fixed `foundry.toml` to use Etherscan V2. Retry:
```
forge verify-contract 0xA45Be472a64eE6Daa093c6a975Cd8908C615d594 src/Opentip.sol:Opentip --chain 84532 --watch
```
