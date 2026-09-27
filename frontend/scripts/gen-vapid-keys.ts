import { webcrypto } from "node:crypto";

const { subtle } = webcrypto;

async function main() {
  const keyPair = await subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );

  const privRaw = await subtle.exportKey("pkcs8", keyPair.privateKey);
  const pubRaw = await subtle.exportKey("spki", keyPair.publicKey);

  const toBase64Url = (buf: ArrayBuffer) =>
    Buffer.from(buf)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

  console.log("VAPID_PUBLIC_KEY=" + toBase64Url(pubRaw));
  console.log("VAPID_PRIVATE_KEY=" + toBase64Url(privRaw));
}

main().catch(console.error);
