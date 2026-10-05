import assert from "node:assert/strict";
import test from "node:test";
import { sameOriginNotificationUrl } from "../public/notification-url.js";

const origin = "https://opentip.tech";

test("keeps same-origin paths and absolute URLs", () => {
  assert.equal(sameOriginNotificationUrl("/dashboard", origin), "https://opentip.tech/dashboard");
  assert.equal(
    sameOriginNotificationUrl("https://opentip.tech/wallet?tab=1#x", origin),
    "https://opentip.tech/wallet?tab=1#x",
  );
  assert.equal(sameOriginNotificationUrl("/", origin), "https://opentip.tech/");
  assert.equal(sameOriginNotificationUrl("", origin), "https://opentip.tech/");
});

test("falls back to / for cross-origin and non-http URLs", () => {
  const fallback = "https://opentip.tech/";
  for (const raw of [
    "https://evil.example/phish",
    "http://evil.example",
    "//evil.example/phish",
    "https://opentip.tech.evil.example/",
    "javascript:alert(1)",
    "data:text/html,hi",
    "https://user:pass@evil.example/",
  ]) {
    assert.equal(sameOriginNotificationUrl(raw, origin), fallback, raw);
  }
});
