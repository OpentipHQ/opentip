import assert from "node:assert/strict";
import test from "node:test";
import { ethTipAmountError } from "./eth-tip.ts";

test("blocks ETH tips when the price is missing or zero", () => {
  assert.equal(ethTipAmountError(0.01, 0), "ETH price is unavailable. Try again shortly.");
  assert.equal(ethTipAmountError(1, undefined), "ETH price is unavailable. Try again shortly.");
  assert.equal(ethTipAmountError(1, null), "ETH price is unavailable. Try again shortly.");
  assert.equal(ethTipAmountError(1, Number.NaN), "ETH price is unavailable. Try again shortly.");
});

test("still enforces the $1 minimum when ETH has a price", () => {
  assert.equal(ethTipAmountError(0.0001, 3000), "Minimum tip is $1");
  assert.equal(ethTipAmountError(0.001, 3000), undefined);
});
