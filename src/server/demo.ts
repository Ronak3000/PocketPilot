import { db } from "./db";
import type {
  FinancialProfile,
  MoneyConstitution,
  HistoryEntry,
} from "@/features/types";

/**
 * Seeds Aarav's demo data as defined in docs/DEMO_SCENARIO.md
 * Uses frontend type shapes exclusively.
 */
export function seedAaravDemo() {
  db.reset();

  const now = new Date().toISOString();

  const aaravProfile: FinancialProfile = {
    id: "demo-user-aarav",
    name: "Aarav",
    currentBalancePaise: 7_200_000, // ₹72,000
    monthlySalaryPaise: 4_800_000, // ₹48,000
    salaryDay: 1,
    rentPaise: 1_400_000, // ₹14,000
    familyTransferPaise: 500_000, // ₹5,000
    existingEmiPaise: 350_000, // ₹3,500
    monthlySavingsTargetPaise: 800_000, // ₹8,000
    protectedBalanceFloorPaise: 1_000_000, // ₹10,000
    emergencyFundGoalPaise: 15_000_000, // ₹1,50,000
    emergencyFundCurrentPaise: 4_500_000, // ₹45,000
    createdAt: now,
    updatedAt: now,
  };

  db.setProfile(aaravProfile);

  const aaravConstitution: MoneyConstitution = {
    id: "constitution-aarav",
    profileId: "demo-user-aarav",
    rules: [
      {
        id: "rule-floor",
        name: "Protected Balance Floor",
        description: "Balance must never drop below ₹10,000",
        category: "floor",
        enabled: true,
        locked: true,
        thresholdType: "amount_paise",
        thresholdValue: 1_000_000,
        reasonCode: "MINIMUM_BALANCE_BREACH",
        icon: "🛡️",
        createdAt: now,
      },
      {
        id: "rule-savings",
        name: "Monthly Savings Target",
        description: "Save at least ₹8,000 every month",
        category: "goal",
        enabled: true,
        locked: false,
        thresholdType: "amount_paise",
        thresholdValue: 800_000,
        reasonCode: "SAVINGS_TARGET_MISSED",
        icon: "🎯",
        createdAt: now,
      },
      {
        id: "rule-emi-ratio",
        name: "EMI-to-Income Ratio",
        description: "Total EMIs must stay below 40% of monthly income",
        category: "ratio",
        enabled: true,
        locked: false,
        thresholdType: "percentage",
        thresholdValue: 40,
        reasonCode: "EMI_RATIO_EXCEEDED",
        icon: "📊",
        createdAt: now,
      },
      {
        id: "rule-emi-duration",
        name: "Maximum EMI Tenure",
        description: "No single EMI should exceed 24 months",
        category: "ceiling",
        enabled: true,
        locked: false,
        thresholdType: "months",
        thresholdValue: 24,
        reasonCode: "EMI_DURATION_EXCEEDED",
        icon: "⏳",
        createdAt: now,
      },
      {
        id: "rule-rent",
        name: "Rent is Protected",
        description: "Rent must always be payable",
        category: "protection",
        enabled: true,
        locked: true,
        thresholdType: "amount_paise",
        thresholdValue: 1_400_000,
        reasonCode: "PROTECTED_EXPENSE_AT_RISK",
        icon: "🏠",
        createdAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  db.setConstitution(aaravConstitution);

  // Seed some history entries
  const historyEntries: HistoryEntry[] = [
    {
      id: "hist-001",
      type: "breach_prevented",
      title: "Laptop impulse buy — ₹89,999",
      status: "WARNING",
      createdAt: "2025-06-20T11:00:00Z",
    },
    {
      id: "hist-002",
      type: "goal_delay_avoided",
      title: "Switched to ₹35,999 phone instead of ₹52,999",
      status: "SAFE",
      createdAt: "2025-05-10T16:00:00Z",
    },
  ];

  for (const entry of historyEntries) {
    db.addHistoryEntry(entry);
  }

  return { profile: aaravProfile, constitution: aaravConstitution };
}

export function resetDemo() {
  db.reset();
}
