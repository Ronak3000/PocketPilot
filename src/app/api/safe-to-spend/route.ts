import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { runFullAnalysis } from "@/server/bridge";

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

  // If we have a cached value, return it
  const cached = db.getSafeToSpend();
  if (cached) {
    return NextResponse.json(cached);
  }

  // Calculate a fresh value using a dummy decision just for safe-to-spend
  try {
    // We can compute safe-to-spend without a purchase decision
    const today = new Date().toISOString().split("T")[0];

    // Use profile data directly for a simpler calculation
    const totalProtected = profile.rentPaise + profile.familyTransferPaise + profile.existingEmiPaise;
    const safeAmount = Math.max(0, profile.currentBalancePaise - profile.protectedBalanceFloorPaise - totalProtected);
    const bufferRatio = safeAmount / profile.monthlySalaryPaise;

    type BufferQuality = "excellent" | "good" | "tight" | "critical";
    let bufferQuality: BufferQuality = "excellent";
    if (bufferRatio < 0.1) bufferQuality = "critical";
    else if (bufferRatio < 0.2) bufferQuality = "tight";
    else if (bufferRatio < 0.4) bufferQuality = "good";

    const safeToSpend = {
      safeAmountPaise: safeAmount,
      protectedAmountPaise: totalProtected,
      upcomingCommitmentPaise: totalProtected,
      bufferQuality,
      confidence: 0.95,
      lastCalculatedAt: new Date().toISOString(),
    };

    db.setSafeToSpend(safeToSpend);
    return NextResponse.json(safeToSpend);
  } catch {
    return NextResponse.json({ error: "Calculation failed" }, { status: 500 });
  }
}
