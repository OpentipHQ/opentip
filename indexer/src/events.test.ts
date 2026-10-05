import assert from "node:assert/strict";
import test from "node:test";
import { payoutUpdateFromEvent } from "./events.ts";

test("updates the payout address from an admin reassignment", () => {
  assert.deepEqual(
    payoutUpdateFromEvent("AdminPayoutReassigned", {
      repoId: "acme/app",
      newAddress: "0xABCDef0000000000000000000000000000000001",
    }),
    { repoId: "acme/app", payoutAddress: "0xabcdef0000000000000000000000000000000001" },
  );
});

test("keeps the owner rotation on the same path", () => {
  assert.deepEqual(
    payoutUpdateFromEvent("PayoutAddressUpdated", {
      repoId: "acme/app",
      newAddress: "0x1111111111111111111111111111111111111111",
    })?.payoutAddress,
    "0x1111111111111111111111111111111111111111",
  );
  assert.equal(payoutUpdateFromEvent("TipReceived", { repoId: "acme/app" }), null);
});
