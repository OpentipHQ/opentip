import assert from "node:assert/strict";
import test from "node:test";
import { ETH_ADDRESS, USDC_ADDRESS } from "./chain.ts";
import { addPricedSpend, emptyTally } from "./spend-usd.ts";

test("prices a known token and ignores zero spends", () => {
  const prices = { [USDC_ADDRESS.toLowerCase()]: 1 };
  const tally = addPricedSpend(emptyTally(), "5000000", USDC_ADDRESS, prices);
  assert.equal(tally.unpriced, false);
  assert.equal(tally.usd, 5);
  const zero = addPricedSpend(emptyTally(), "0", USDC_ADDRESS, prices);
  assert.deepEqual(zero, { usd: 0, unpriced: false });
});

test("does not count an unpriced token as $0", () => {
  const tally = addPricedSpend(emptyTally(), "1000000", ETH_ADDRESS, { [ETH_ADDRESS.toLowerCase()]: 0 });
  assert.equal(tally.usd, 0);
  assert.equal(tally.unpriced, true);
  const missing = addPricedSpend(emptyTally(), "1", "0x1111111111111111111111111111111111111111", {});
  assert.equal(missing.unpriced, true);
});
