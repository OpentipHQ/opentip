// Minimal Relay same-chain swap helper — ETH→USDC via relay.link API.
// Docs: https://docs.relay.link — POST /quote/v2 then execute via viem.
// For same-chain swap we request originChainId == destinationChainId.

import { CHAIN_ID, USDC_ADDRESS } from "@/lib/chain";

export async function getRelayQuote(params: {
  amountWei: string; // ETH in wei (string)
  recipient: string;
}) {
  const key = process.env.NEXT_PUBLIC_RELAY_API_KEY;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (key) headers["x-relay-api-key"] = key;

  const body = {
    user: params.recipient,
    originChainId: CHAIN_ID,
    destinationChainId: CHAIN_ID,
    originCurrency: "0x0000000000000000000000000000000000000000",
    destinationCurrency: USDC_ADDRESS,
    amount: params.amountWei,
    tradeType: "EXACT_INPUT",
    recipient: params.recipient,
  };

  const res = await fetch("https://api.relay.link/quote/v2", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Relay quote failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function getRelayStatus(requestId: string) {
  const res = await fetch(`https://api.relay.link/intents/status/v3?requestId=${requestId}`);
  if (!res.ok) throw new Error(`Relay status failed: ${res.status}`);
  return res.json();
}
