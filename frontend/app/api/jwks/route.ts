import { NextResponse } from "next/server";
import { getJwks } from "@/lib/jwks";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// Primary JWKS endpoint (/.well-known/jwks.json rewrites here via next.config.js).
// Must always return 200 JSON — never redirect — or CDP fails with "JWKS 302".
export async function GET() {
  try {
    const jwks = await getJwks();
    if (!jwks?.keys?.[0]?.n || !jwks?.keys?.[0]?.e) {
      throw new Error("Invalid JWKS shape — check JWT_PRIVATE_KEY");
    }
    return NextResponse.json(jwks, {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e: any) {
    console.error("JWKS error:", e.message);
    return NextResponse.json({ error: e.message, keys: [] }, { status: 500 });
  }
}
