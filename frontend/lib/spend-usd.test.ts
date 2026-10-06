import assert from "node:assert/strict";
import test from "node:test";
import { addPricedSpend, emptyTally, type ToUsd } from "./spend-usd.ts";

const USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const ETH = "0x0000000000000000000000000000000000000000";

const toUsd: ToUsd = (raw, token, prices) => {
  const decimals = token.toLowerCase() === USDC ? 6 : 18;
  const price = prices[token.toLowerCase()] ?? 0;
  return Number(raw) / 10 ** decimals * price;
};

test("prices a known token and ignores zero spends", () => {
  const prices = { [USDC]: 1 };
  const tally = addPricedSpend(emptyTally(), "5000000", USDC, prices, toUsd);
  assert.equal(tally.unpriced, false);
  assert.equal(tally.usd, 5);
  const zero = addPricedSpend(emptyTally(), "0", USDC, prices, toUsd);
  assert.deepEqual(zero, { usd: 0, unpriced: false });
});

test("does not count an unpriced token as $0", () => {
  const tally = addPricedSpend(emptyTally(), "1000000", ETH, { [ETH]: 0 }, toUsd);
  assert.equal(tally.usd, 0);
  assert.equal(tally.unpriced, true);
  const missing = addPricedSpend(emptyTally(), "1", "0x1111111111111111111111111111111111111111", {}, toUsd);
  assert.equal(missing.unpriced, true);
});
