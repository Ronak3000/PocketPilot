import { NextResponse } from "next/server";
import { seedAaravDemo } from "@/server/demo";

/**
 * POST /api/reset
 * Resets the demo and seeds Aarav's data fresh.
 */
export async function POST() {
  const data = seedAaravDemo();
  return NextResponse.json({ success: true, data });
}
