export const opentipV2Abi = [
  // Registration
  { type: "function", name: "registerRepo", stateMutability: "nonpayable", inputs: [{ name: "repoId", type: "string" }, { name: "payoutAddress", type: "address" }, { name: "expiry", type: "uint256" }, { name: "nonce", type: "uint256" }, { name: "signature", type: "bytes" }], outputs: [] },
  { type: "function", name: "adminMigrateRepo", stateMutability: "nonpayable", inputs: [{ name: "repoId", type: "string" }, { name: "payoutAddress", type: "address" }], outputs: [] },
  { type: "function", name: "DOMAIN_SEPARATOR", stateMutability: "view", inputs: [], outputs: [{ type: "bytes32" }] },
  { type: "function", name: "usedNonces", stateMutability: "view", inputs: [{ name: "", type: "uint256" }], outputs: [{ type: "bool" }] },

  // User functions
  { type: "function", name: "updatePayoutAddress", stateMutability: "nonpayable", inputs: [{ name: "repoId", type: "string" }, { name: "newAddress", type: "address" }], outputs: [] },
  { type: "function", name: "receiveTipEth", stateMutability: "payable", inputs: [{ name: "repoId", type: "string" }], outputs: [] },
  { type: "function", name: "receiveTip", stateMutability: "nonpayable", inputs: [{ name: "repoId", type: "string" }, { name: "token", type: "address" }, { name: "amount", type: "uint256" }], outputs: [] },
  { type: "function", name: "claimAll", stateMutability: "nonpayable", inputs: [{ name: "repoId", type: "string" }], outputs: [] },

  // Views
  { type: "function", name: "isRegistered", stateMutability: "view", inputs: [{ name: "repoId", type: "string" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "getPendingBalance", stateMutability: "view", inputs: [{ name: "repoId", type: "string" }, { name: "token", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "getPayoutAddress", stateMutability: "view", inputs: [{ name: "repoId", type: "string" }], outputs: [{ type: "address" }] },
  { type: "function", name: "getTotalTipped", stateMutability: "view", inputs: [{ name: "repoId", type: "string" }, { name: "token", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "getTotalTipCount", stateMutability: "view", inputs: [{ name: "repoId", type: "string" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "getTokenList", stateMutability: "view", inputs: [], outputs: [{ type: "address[]" }] },
  { type: "function", name: "getTokenCount", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "acceptedTokens", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "tokenDecimals", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ type: "uint8" }] },
  { type: "function", name: "everAcceptedTokens", stateMutability: "view", inputs: [{ name: "", type: "uint256" }], outputs: [{ type: "address" }] },
  { type: "function", name: "strayEth", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "migrationDeadline", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "tokenList", stateMutability: "view", inputs: [{ name: "", type: "uint256" }], outputs: [{ type: "address" }] },
  { type: "function", name: "treasuryBalances", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "feeBps", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "treasuryAddress", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "owner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "registrarSigner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },

  // Admin functions
  { type: "function", name: "addToken", stateMutability: "nonpayable", inputs: [{ name: "token", type: "address" }, { name: "decimals", type: "uint8" }], outputs: [] },
  { type: "function", name: "removeToken", stateMutability: "nonpayable", inputs: [{ name: "token", type: "address" }], outputs: [] },
  { type: "function", name: "adminReassignPayout", stateMutability: "nonpayable", inputs: [{ name: "repoId", type: "string" }, { name: "newAddress", type: "address" }], outputs: [] },
  { type: "function", name: "adminMigrateRepo", stateMutability: "nonpayable", inputs: [{ name: "repoId", type: "string" }, { name: "payoutAddress", type: "address" }], outputs: [] },
  { type: "function", name: "pause", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "unpause", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "withdrawTreasury", stateMutability: "nonpayable", inputs: [{ name: "token", type: "address" }, { name: "amount", type: "uint256" }], outputs: [] },
  { type: "function", name: "setFeeBps", stateMutability: "nonpayable", inputs: [{ name: "newFeeBps", type: "uint256" }], outputs: [] },
  { type: "function", name: "setTreasuryAddress", stateMutability: "nonpayable", inputs: [{ name: "newTreasury", type: "address" }], outputs: [] },
  { type: "function", name: "setRegistrarSigner", stateMutability: "nonpayable", inputs: [{ name: "newSigner", type: "address" }], outputs: [] },
  { type: "function", name: "sweepStrayEth", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }], outputs: [] },
  { type: "function", name: "setMigrationDeadline", stateMutability: "nonpayable", inputs: [{ name: "deadline", type: "uint256" }], outputs: [] },

  // Events
  { type: "event", name: "RepoRegistered", inputs: [{ name: "repoId", type: "string", indexed: false }, { name: "payoutAddress", type: "address", indexed: true }, { name: "timestamp", type: "uint256" }] },
  { type: "event", name: "PayoutAddressUpdated", inputs: [{ name: "repoId", type: "string", indexed: false }, { name: "oldAddress", type: "address", indexed: false }, { name: "newAddress", type: "address", indexed: true }] },
  { type: "event", name: "TipReceived", inputs: [{ name: "tipper", type: "address", indexed: true }, { name: "repoId", type: "string", indexed: false }, { name: "token", type: "address", indexed: true }, { name: "amount", type: "uint256" }, { name: "feeAmount", type: "uint256" }, { name: "timestamp", type: "uint256" }] },
  { type: "event", name: "Claimed", inputs: [{ name: "repoId", type: "string", indexed: false }, { name: "payoutAddress", type: "address", indexed: true }, { name: "token", type: "address", indexed: true }, { name: "amount", type: "uint256" }, { name: "timestamp", type: "uint256" }] },
  { type: "event", name: "TreasuryWithdrawn", inputs: [{ name: "to", type: "address", indexed: true }, { name: "token", type: "address", indexed: true }, { name: "amount", type: "uint256" }, { name: "timestamp", type: "uint256" }] },
  { type: "event", name: "FeeUpdated", inputs: [{ name: "oldFeeBps", type: "uint256" }, { name: "newFeeBps", type: "uint256" }] },
  { type: "event", name: "TreasuryAddressUpdated", inputs: [{ name: "oldTreasury", type: "address", indexed: true }, { name: "newTreasury", type: "address", indexed: true }] },
  { type: "event", name: "RegistrarSignerUpdated", inputs: [{ name: "oldSigner", type: "address", indexed: true }, { name: "newSigner", type: "address", indexed: true }] },
  { type: "event", name: "AdminPayoutReassigned", inputs: [{ name: "repoId", type: "string", indexed: false }, { name: "oldAddress", type: "address", indexed: true }, { name: "newAddress", type: "address", indexed: true }, { name: "admin", type: "address", indexed: true }] },
  { type: "event", name: "TokenAdded", inputs: [{ name: "token", type: "address", indexed: true }, { name: "decimals", type: "uint8" }] },
  { type: "event", name: "TokenRemoved", inputs: [{ name: "token", type: "address", indexed: true }] },
] as const;

export const erc20Abi = [
  { type: "function", name: "transfer", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "approve", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
  { type: "function", name: "allowance", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "balanceOf", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "decimals", inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" },
] as const;
