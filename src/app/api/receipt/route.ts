import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET() {
  const receipt = db.getLastReceipt();
  if (!receipt) {
    return NextResponse.json({ error: "No receipt available. Submit a decision first." }, { status: 404 });
  }
  return NextResponse.json(receipt);
}
