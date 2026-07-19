import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET() {
  return NextResponse.json(db.getHistory());
}
