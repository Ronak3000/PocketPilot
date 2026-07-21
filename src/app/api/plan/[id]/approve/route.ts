import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function POST() {
  const plan = db.getLastPlan();
  if (!plan) {
    return NextResponse.json({ error: "No plan to approve" }, { status: 404 });
  }

  const approved = { ...plan, status: "approved" as const };
  db.setLastPlan(approved);

  // Add to history
  db.addHistoryEntry({
    id: `hist-${Date.now()}`,
    type: "plan_approved",
    title: `${db.getLastReceipt()?.productName ?? "Purchase"} — Safe Plan Approved`,
    status: "SAFE",
    plan: approved,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json(approved);
}
