import assert from "node:assert/strict";
import test from "node:test";
import { ETH_ADDRESS, USDC_ADDRESS } from "./chain.ts";
import { rankTippersByUsd, rowsForTopTippers } from "./leaderboard-rank.ts";

const prices = {
  [ETH_ADDRESS.toLowerCase()]: 3000,
  [USDC_ADDRESS.toLowerCase()]: 1,
};

test("ranks by USD before the limit, not by raw base units", () => {
  const rows = [
    // 0.001 ETH = $3, but the raw amount (1e15) is larger than the USDC row.
    { tipper_address: "0xBOB", total: "1000000000000000", token: ETH_ADDRESS },
    // 10,000 USDC = $10,000, raw amount 1e10.
    { tipper_address: "0xALICE", total: "10000000000", token: USDC_ADDRESS },
  ];
  const top = rankTippersByUsd(rows, prices, 1);
  assert.equal(top.length, 1);
  assert.equal(top[0].tipper_address, "0xALICE");
  assert.ok(top[0].usd > 9000);
});

test("keeps every token row for the tippers who survive the USD limit", () => {
  const rows = [
    { tipper_address: "0xBOB", total: "1000000000000000", token: ETH_ADDRESS },
    { tipper_address: "0xALICE", total: "10000000000", token: USDC_ADDRESS },
    { tipper_address: "0xALICE", total: "1000000000000000000", token: ETH_ADDRESS },
  ];
  const kept = rowsForTopTippers(rows, prices, 1);
  assert.deepEqual(kept.map((row) => row.tipper_address), ["0xALICE", "0xALICE"]);
});
