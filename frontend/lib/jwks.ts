import { createPrivateKey, createPublicKey } from "crypto";
import type { JWK } from "jose";

let cachedPublicJwk: JWK | null = null;

function getPem() {
  let pem = process.env.JWT_PRIVATE_KEY || process.env.CDP_JWT_PRIVATE_KEY;
  if (!pem) throw new Error("JWT_PRIVATE_KEY not set — run node scripts/gen-jwt-key.js");
  pem = pem.trim();
  // Strip surrounding quotes if dotenv kept them
  if ((pem.startsWith('"') && pem.endsWith('"')) || (pem.startsWith("'") && pem.endsWith("'"))) {
    pem = pem.slice(1, -1);
  }
  // Convert literal \n to real newlines (one-line env format)
  pem = pem.replace(/\\n/g, "\n");
  return pem.trim();
}

export function getPublicJwk(): JWK {
  if (cachedPublicJwk) return cachedPublicJwk;
  const pub = createPublicKey(getPem());
  const jwk = pub.export({ format: "jwk" }) as JWK;
  jwk.alg = "RS256";
  jwk.use = "sig";
  jwk.kid = process.env.JWT_KID || process.env.CDP_JWT_KID || "opentip-2026-09";
  cachedPublicJwk = jwk;
  return jwk;
}

export async function getJwks() {
  return { keys: [getPublicJwk()] };
}

export async function signCdpJwt(userId: string) {
  const kid = process.env.JWT_KID || process.env.CDP_JWT_KID || "opentip-2026-09";
  const issuer = process.env.CDP_JWT_ISSUER || process.env.JWT_ISSUER || "https://opentip.tech";
  const audience = process.env.CDP_JWT_AUDIENCE || process.env.JWT_AUDIENCE || "opentip";
  const privateKey = createPrivateKey(getPem());
  const { SignJWT } = await import("jose");
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: "RS256", kid })
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(privateKey as any);
  return jwt;
}
