import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET() {
  const plan = db.getLastPlan();
  if (!plan) {
    return NextResponse.json({ error: "No plan available." }, { status: 404 });
  }
  return NextResponse.json(plan);
}
