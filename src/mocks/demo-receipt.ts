import type { FutureReceipt } from "@/features/types";
import { demoScenarios } from "./demo-scenarios";

/**
 * Future Receipt for the "Buy Now" scenario — the primary demo receipt.
 * All money values in integer paise.
 */
export const demoReceipt: FutureReceipt = {
  id: "receipt-001",
  scenarioResultId: "scenario-buy-now-001",
  status: "CAUTION",
  productName: "Samsung Galaxy S25 Ultra",
  listedPricePaise: 5_999_900,           // ₹59,999
  upfrontPaymentPaise: 1_200_000,        // ₹12,000
  emiAmountPaise: 450_000,               // ₹4,500
  tenureMonths: 12,
  processingFeePaise: 149_900,           // ₹1,499
  totalCommittedPaise: 6_749_900,        // ₹67,499
  commitmentEndDate: "2026-07-15",
  lowestProjectedBalancePaise: 850_000,  // ₹8,500
  lowestBalanceDate: "2025-07-28",
  lowBalanceDays: 4,
  negativeBalanceDays: 0,
  goalDelayDays: 45,
  emiBurdenPercent: 16.7,
  constitutionConflicts: demoScenarios.buyNow.constitutionConflicts,
  assumptions: [
    "Salary of ₹48,000 credited on 1st of each month",
    "No additional large expenses during the projection period",
    "Existing EMI of ₹3,500 continues for the full projection",
    "Rent, family transfer, and savings continue at current levels",
    "No salary increase assumed",
    "Emergency fund contributions continue at ₹8,000/month minus EMI impact",
  ],
  confidence: 0.87,
  recommendation:
    "This purchase is affordable but creates tightness. Your lowest balance (₹8,500) dips below your savings comfort level, and your emergency fund goal will be delayed by ~45 days. Consider waiting 45 days to build a buffer.",
  dailyLedger: demoScenarios.buyNow.dailyLedger,
  projectedBalances: demoScenarios.buyNow.projectedBalances,
  createdAt: "2025-07-15T14:30:00Z",
};
