import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET() {
  const comparison = db.getLastComparison();
  if (!comparison) {
    return NextResponse.json({ error: "No scenarios available. Submit a decision first." }, { status: 404 });
  }
  return NextResponse.json(comparison);
}
