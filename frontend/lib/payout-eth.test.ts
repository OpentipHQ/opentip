import assert from "node:assert/strict";
import test from "node:test";
import { classifyProbeFailure, interpretEthReceiveProbe, PAYOUT_ETH_REJECTED } from "./payout-eth-probe.ts";

test("treats an empty account as able to receive ETH", () => {
  assert.deepEqual(interpretEthReceiveProbe({ bytecode: undefined, probe: "reverted" }), { ok: true });
  assert.deepEqual(interpretEthReceiveProbe({ bytecode: "0x", probe: "unavailable" }), { ok: true });
});

test("blocks a contract whose ETH receive probe reverts", () => {
  const result = interpretEthReceiveProbe({ bytecode: "0x6000", probe: "reverted" });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, PAYOUT_ETH_REJECTED);
});

test("allows a contract that accepts the probe", () => {
  assert.deepEqual(interpretEthReceiveProbe({ bytecode: "0x6000", probe: "success" }), { ok: true });
});

test("classifies execution reverts separately from RPC failures", () => {
  assert.equal(classifyProbeFailure("Execution reverted"), "reverted");
  assert.equal(classifyProbeFailure("insufficient funds"), "unavailable");
});
