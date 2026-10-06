import assert from "node:assert/strict";
import test from "node:test";
import { isTrustedNotificationRequest, notificationSecretsMatch } from "./notification-auth.ts";

test("rejects missing, empty, and unset secrets", () => {
  assert.equal(notificationSecretsMatch(null, "secret"), false);
  assert.equal(notificationSecretsMatch("", "secret"), false);
  assert.equal(notificationSecretsMatch("secret", ""), false);
  assert.equal(notificationSecretsMatch("secret", undefined), false);
  assert.equal(isTrustedNotificationRequest(null, undefined), false);
  assert.equal(isTrustedNotificationRequest("secret", undefined), false);
});

test("rejects a wrong secret, including a prefix of the real one", () => {
  assert.equal(notificationSecretsMatch("nope", "secret"), false);
  assert.equal(notificationSecretsMatch("secret-extra", "secret"), false);
  assert.equal(notificationSecretsMatch("secre", "secret"), false);
  assert.equal(isTrustedNotificationRequest("attacker", "secret"), false);
});

test("accepts only an exact shared secret", () => {
  assert.equal(notificationSecretsMatch("secret", "secret"), true);
  assert.equal(isTrustedNotificationRequest("secret", "secret"), true);
});
