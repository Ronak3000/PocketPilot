import { NextResponse } from "next/server";
import { db } from "@/server/db";
import type { ConstitutionRule, FinancialProfile, MoneyConstitution, RuleCategory } from "@/features/types";
import { randomUUID } from "crypto";

/**
 * Generates a constitution with rules seeded from the user's actual profile values.
 * Called the first time a profile is set so that rule thresholds match what the user entered.
 */
function buildConstitutionFromProfile(profile: FinancialProfile): MoneyConstitution {
  const now = new Date().toISOString();
  return {
    id: `constitution-${profile.id}`,
    profileId: profile.id,
    rules: ([
      {
        id: randomUUID(),
        name: "Protected Balance Floor",
        description: `Balance must never drop below ₹${Math.floor(profile.protectedBalanceFloorPaise / 100).toLocaleString("en-IN")}`,
        category: "floor" as RuleCategory,
        enabled: true,
        locked: true,
        thresholdType: "amount_paise" as const,
        thresholdValue: profile.protectedBalanceFloorPaise,
        reasonCode: "MINIMUM_BALANCE_BREACH",
        icon: "🛡️",
        createdAt: now,
      },
      {
        id: randomUUID(),
        name: "Monthly Savings Target",
        description: `Save at least ₹${Math.floor(profile.monthlySavingsTargetPaise / 100).toLocaleString("en-IN")} every month`,
        category: "goal" as RuleCategory,
        enabled: true,
        locked: false,
        thresholdType: "amount_paise" as const,
        thresholdValue: profile.monthlySavingsTargetPaise,
        reasonCode: "SAVINGS_TARGET_MISSED",
        icon: "🎯",
        createdAt: now,
      },
      {
        id: randomUUID(),
        name: "EMI-to-Income Ratio",
        description: "Total EMIs must stay below 40% of monthly income",
        category: "ratio" as RuleCategory,
        enabled: true,
        locked: false,
        thresholdType: "percentage" as const,
        thresholdValue: 40,
        reasonCode: "EMI_RATIO_EXCEEDED",
        icon: "📊",
        createdAt: now,
      },
      {
        id: randomUUID(),
        name: "Maximum EMI Tenure",
        description: "No single EMI should exceed 24 months",
        category: "ceiling" as RuleCategory,
        enabled: true,
        locked: false,
        thresholdType: "months" as const,
        thresholdValue: 24,
        reasonCode: "EMI_DURATION_EXCEEDED",
        icon: "⏳",
        createdAt: now,
      },
      {
        id: randomUUID(),
        name: "Rent is Protected",
        description: `Rent of ₹${Math.floor(profile.rentPaise / 100).toLocaleString("en-IN")} must always be payable`,
        category: "protection" as RuleCategory,
        enabled: profile.rentPaise > 0,
        locked: true,
        thresholdType: "amount_paise" as const,
        thresholdValue: profile.rentPaise,
        reasonCode: "PROTECTED_EXPENSE_AT_RISK",
        icon: "🏠",
        createdAt: now,
      },
    ] as ConstitutionRule[]).filter((rule) => rule.enabled),
    createdAt: now,
    updatedAt: now,
  };
}

export async function GET() {
  const profile = db.getProfile();
  if (!profile) {
    return NextResponse.json({ error: "Profile not found. Run POST /api/reset to seed demo data." }, { status: 404 });
  }
  return NextResponse.json(profile);
}

export async function PATCH(request: Request) {
  try {
    const updates = await request.json();
    const updated = db.patchProfile(updates);
    if (!updated) {
      // No profile yet — create one fresh
      const now = new Date().toISOString();
      const newProfile: FinancialProfile = {
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
        name: "",
        currentBalancePaise: 0,
        monthlySalaryPaise: 0,
        salaryDay: 1,
        rentPaise: 0,
        familyTransferPaise: 0,
        existingEmiPaise: 0,
        monthlySavingsTargetPaise: 0,
        protectedBalanceFloorPaise: 0,
        emergencyFundGoalPaise: 0,
        emergencyFundCurrentPaise: 0,
        ...updates,
      };
      db.setProfile(newProfile);
      // Bootstrap constitution from actual values
      if (!db.getConstitution()) {
        db.setConstitution(buildConstitutionFromProfile(newProfile));
      }
      return NextResponse.json(newProfile);
    }
    // Profile already exists — if constitution thresholds need updating, do so
    if (!db.getConstitution()) {
      db.setConstitution(buildConstitutionFromProfile(updated));
    }
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    db.setProfile(body);
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
