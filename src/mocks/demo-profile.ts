import type { FinancialProfile } from "@/features/types";

/**
 * Aarav's complete financial profile from DEMO_SCENARIO.md
 * All money values in integer paise (₹1 = 100 paise)
 */
export const demoProfile: FinancialProfile = {
  id: "profile-aarav-001",
  name: "Aarav",
  currentBalancePaise: 7_200_000,       // ₹72,000
  monthlySalaryPaise: 4_800_000,        // ₹48,000
  salaryDay: 1,
  rentPaise: 1_400_000,                 // ₹14,000
  familyTransferPaise: 500_000,         // ₹5,000
  existingEmiPaise: 350_000,            // ₹3,500
  monthlySavingsTargetPaise: 800_000,   // ₹8,000
  protectedBalanceFloorPaise: 1_000_000, // ₹10,000
  emergencyFundGoalPaise: 15_000_000,   // ₹1,50,000
  emergencyFundCurrentPaise: 2_400_000, // ₹24,000
  personaMode: "cautious",
  createdAt: "2025-07-01T10:00:00Z",
  updatedAt: "2025-07-01T10:00:00Z",
};
