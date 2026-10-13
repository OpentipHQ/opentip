import assert from "node:assert/strict";
import test from "node:test";
import { claimShareTotal, receiptHeadline, type ReceiptAmountLeg } from "./receipt-display.ts";

const USDC = "0x036cbd53842c5426634e7929541ec2318f3dcf7e";
const ETH = "0x0000000000000000000000000000000000000000";

const usdc: ReceiptAmountLeg = {
  token: USDC,
  symbol: "USDC",
  amount: "19000000",
  maintainer: "19000000",
};
const eth: ReceiptAmountLeg = {
  token: ETH,
  symbol: "ETH",
  amount: "9500000000000000",
  maintainer: "9500000000000000",
};

test("prices a multi-token claim as combined USD plus a breakdown", () => {
  const prices = { [USDC]: 1, [ETH]: 3000 };
  const headline = receiptHeadline("claim", [usdc, eth], prices);
  assert.deepEqual(headline, {
    mode: "usd",
    usd: "$47.50",
    breakdown: "19 USDC + 0.0095 ETH",
  });
  assert.equal(claimShareTotal([usdc, eth], prices), "$47.50");
});

test("stacks token amounts when any leg has no positive price", () => {
  const headline = receiptHeadline("claim", [usdc, eth], { [USDC]: 1, [ETH]: 0 });
  assert.deepEqual(headline, {
    mode: "stacked",
    lines: [
      { token: USDC, amount: "19", symbol: "USDC", label: "19 USDC" },
      { token: ETH, amount: "0.0095", symbol: "ETH", label: "0.0095 ETH" },
    ],
  });
  assert.equal(claimShareTotal([usdc, eth], { [USDC]: 1 }), "19 USDC + 0.0095 ETH");
});

test("keeps a single leg as its token amount and prices the claim share", () => {
  assert.deepEqual(receiptHeadline("fund", [usdc], { [USDC]: 1 }), {
    mode: "single",
    amount: "19",
    symbol: "USDC",
  });
  assert.equal(claimShareTotal([usdc], { [USDC]: 1 }), "$19.00");
});

test("prices a multi-token tip from the gross amount", () => {
  const tip = { ...usdc, amount: "20000000", maintainer: "19000000" };
  const headline = receiptHeadline("fund", [tip, eth], { [USDC]: 1, [ETH]: 2000 });
  assert.equal(headline.mode, "usd");
  if (headline.mode !== "usd") return;
  assert.equal(headline.usd, "$39.00");
  assert.equal(headline.breakdown, "20 USDC + 0.0095 ETH");
});
