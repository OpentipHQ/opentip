import assert from "node:assert/strict";
import test from "node:test";
import { isHiddenRepo } from "./repo-visibility.ts";

test("hidden repos are not found", () => {
  assert.equal(isHiddenRepo({ hidden: true }), true);
});

test("visible and missing repos are not treated as hidden", () => {
  assert.equal(isHiddenRepo({ hidden: false }), false);
  assert.equal(isHiddenRepo(null), false);
  assert.equal(isHiddenRepo(undefined), false);
});
