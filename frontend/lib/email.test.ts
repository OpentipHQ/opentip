import assert from "node:assert/strict";
import test from "node:test";

test("email module loads when RESEND_API_KEY is unset", async () => {
  const previous = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  try {
    const email = await import("./email.ts");
    assert.equal(typeof email.sendVerificationEmail, "function");
  } finally {
    if (previous === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previous;
  }
});
