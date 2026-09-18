import { NextResponse } from "next/server";
import { getTokenPrices } from "@/lib/prices";

export const dynamic = "force-dynamic";

export async function GET() {
  const prices = await getTokenPrices();
  return NextResponse.json(prices);
}
