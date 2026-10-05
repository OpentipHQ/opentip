// Client helpers for the app write-ahead log (/api/wallet/tx).
// Every send/tip/claim/register initiated in our UI is recorded at submit
// time so History shows it instantly — including smart-wallet ETH movements
// that no free explorer API can see on Base. Fire-and-forget: logging must
// never break the underlying transaction flow.

export type WalletTxKind = "send" | "tip" | "claim" | "register";

export async function logWalletTx(input: {
  walletAddress: string;
  kind: WalletTxKind;
  repoId?: string;
  token?: string;
  amount?: string;
  toAddress?: string;
  userOpHash?: string;
  txHash?: string;
}): Promise<void> {
  try {
    await fetch("/api/wallet/tx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch (e) {
    console.warn("wallet tx log failed", e);
  }
}

export async function confirmWalletTx(userOpHash: string, txHash: string): Promise<void> {
  try {
    await fetch("/api/wallet/tx", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userOpHash, txHash }),
    });
  } catch (e) {
    console.warn("wallet tx confirm failed", e);
  }
}
