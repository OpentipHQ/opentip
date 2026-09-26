import { NextResponse } from "next/server";
import { getJwks } from "@/lib/jwks";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const jwks = await getJwks();
    // Validate shape before returning — CDP fails with "Failed to parse JWKS" on { error }
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
