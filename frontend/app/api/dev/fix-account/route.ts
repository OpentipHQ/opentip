// Dead route — account creation disabled
import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json({ error: "disabled" }, { status: 410 });
}
