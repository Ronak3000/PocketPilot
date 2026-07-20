import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { profileToEvents } from "@/server/bridge";
import { calculateSafeToSpend } from "@/core/finance";
import type { SafeToSpend } from "@/features/types";

/**
 * GET /api/safe-to-spend
 * Calculates real-time safe-to-spend using the finance engine.
 */
export async function GET() {
  const profile = db.getProfile();
  const constitution = db.getConstitution();

  if (!profile || !constitution) {
    return NextResponse.json({ error: "Profile required" }, { status: 404 });
  }

  // Calculate a fresh value using the finance engine every time
  try {
    const today = new Date().toISOString().split("T")[0];
    const events = profileToEvents(profile);
    
    const stsResult = calculateSafeToSpend({
      startDate: today,
      currentBalancePaise: profile.currentBalancePaise,
      protectedBalanceFloorPaise: profile.protectedBalanceFloorPaise,
      events,
      protectedEventIds: events.filter((e) => e.protected).map((e) => e.id),
    });

    const bufferRatio = stsResult.safeToSpendPaise / profile.monthlySalaryPaise;
    let bufferQuality: SafeToSpend["bufferQuality"] = "excellent";
    if (bufferRatio < 0.1) bufferQuality = "critical";
    else if (bufferRatio < 0.2) bufferQuality = "tight";
    else if (bufferRatio < 0.4) bufferQuality = "good";

    const safeToSpend: SafeToSpend = {
      safeAmountPaise: stsResult.safeToSpendPaise,
      protectedAmountPaise: stsResult.protectedCommitmentsPaise,
      upcomingCommitmentPaise: stsResult.protectedCommitmentsPaise,
      bufferQuality,
      confidence: 0.95,
      lastCalculatedAt: new Date().toISOString(),
    };

    db.setSafeToSpend(safeToSpend);
    return NextResponse.json(safeToSpend);
  } catch (error) {
    console.error("Failed to calculate safe to spend:", error);
    return NextResponse.json({ error: "Calculation failed" }, { status: 500 });
  }
}
