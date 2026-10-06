import assert from "node:assert/strict";
import test from "node:test";
import { canEditRepoIcon } from "./repo-icon-auth.ts";

test("allows a verified GitHub login that matches the owner", () => {
  assert.equal(
    canEditRepoIcon({
      githubLogin: "Torvalds",
      repoId: "torvalds/linux",
      sessionUserId: "user-1",
      payoutWalletUserId: null,
    }),
    true,
  );
});

test("rejects an email-only user whose display name is not a GitHub login", () => {
  assert.equal(
    canEditRepoIcon({
      githubLogin: null,
      repoId: "torvalds/linux",
      sessionUserId: "email-user",
      payoutWalletUserId: null,
    }),
    false,
  );
  assert.equal(
    canEditRepoIcon({
      githubLogin: "",
      repoId: "torvalds/linux",
      sessionUserId: "email-user",
      payoutWalletUserId: "someone-else",
    }),
    false,
  );
});

test("allows the payout-wallet owner even when their login is not the owner segment", () => {
  assert.equal(
    canEditRepoIcon({
      githubLogin: "octocat",
      repoId: "vercel/next.js",
      sessionUserId: "user-1",
      payoutWalletUserId: "user-1",
    }),
    true,
  );
});

test("rejects a different user who merely knows the owner name", () => {
  assert.equal(
    canEditRepoIcon({
      githubLogin: "someone",
      repoId: "torvalds/linux",
      sessionUserId: "user-2",
      payoutWalletUserId: "user-1",
    }),
    false,
  );
});
