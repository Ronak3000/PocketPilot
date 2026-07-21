import type { ActionPlan } from "@/features/types";

/**
 * Safe purchase plan — the recommended safer path for Aarav.
 */
export const demoSafePlan: ActionPlan = {
  id: "plan-001",
  receiptId: "receipt-001",
  recommendedDate: "2025-09-01",
  maxPricePaise: 5_999_900,               // ₹59,999
  requiredDownPaymentPaise: 1_500_000,     // ₹15,000
  maxEmiPaise: 400_000,                    // ₹4,000
  maxTenureMonths: 12,
  requiredBalanceBeforePurchasePaise: 3_000_000, // ₹30,000
  invalidationConditions: [
    "Balance drops below ₹10,000 before purchase date",
    "A new recurring EMI is added before this purchase",
    "Monthly salary changes significantly",
    "Emergency fund contribution is paused",
    "Rent or family transfer amounts change",
  ],
  status: "draft",
  createdAt: "2025-07-15T14:30:00Z",
};
