import assert from "node:assert/strict";
import test from "node:test";
import { mayAnnounceTipSent } from "./wallet-chain.ts";

test("announces a tip only on the configured chain", () => {
  assert.equal(mayAnnounceTipSent(8453, 8453), true);
  assert.equal(mayAnnounceTipSent(84532, 84532), true);
});

test("does not announce a tip confirmed on another chain", () => {
  assert.equal(mayAnnounceTipSent(1, 8453), false);
  assert.equal(mayAnnounceTipSent(84532, 8453), false);
  assert.equal(mayAnnounceTipSent(undefined, 8453), false);
});
