// ── Emergency Context Validator ──
// Returns COMPLETE or INCOMPLETE + exactly ONE missing field question.
// Never replaces missing data with zero.

import type {
  EmergencyContext,
  EmergencyContextResult,
} from "./types";

type RequiredKey = keyof Omit<
  EmergencyContext,
  | "category"
  | "asOfDate"
  | "activeGoal"
  | "maximumEmiRatioBasisPoints"
  | "maximumTenureMonths"
>;

const FIELD_QUESTIONS: Record<RequiredKey, string> = {
  totalNeededPaise:
    "How much money do you need in total? (please share the amount in ₹)",
  alreadyAvailablePaise:
    "How much do you already have available for this right now? (₹, can be 0 if none)",
  requiredByDate:
    "By when do you need the money? (please share the date)",
  currentBalancePaise:
    "What is your current account balance? (₹)",
  monthlyIncomePaise:
    "What is your monthly income? (₹)",
  nextIncomeDate:
    "When is your next income or salary date? (YYYY-MM-DD)",
  protectedBalanceFloorPaise:
    "What is the minimum balance you want to keep in your account at all times? (₹)",
  protectedMonthlyExpensesPaise:
    "What are your total essential monthly expenses (rent, family transfers, existing EMIs)? (₹)",
  existingMonthlyEmiPaise:
    "What are your total existing monthly EMI payments? (₹, or 0 if none)",
  activeGoalMonthlyContributionPaise:
    "Do you have an active savings goal with a monthly contribution? (₹, or 0 if none)",
};

/**
 * Validates the emergency context input.
 * Returns INCOMPLETE with exactly ONE missing field question on the first missing field.
 * Field order defines the question sequence — do not reorder without review.
 */
export function validateEmergencyContext(
  partial: Partial<EmergencyContext> & Pick<EmergencyContext, "category" | "asOfDate">,
): EmergencyContextResult {
  const fields: RequiredKey[] = [
    "totalNeededPaise",
    "alreadyAvailablePaise",
    "requiredByDate",
    "currentBalancePaise",
    "monthlyIncomePaise",
    "nextIncomeDate",
    "protectedBalanceFloorPaise",
    "protectedMonthlyExpensesPaise",
    "existingMonthlyEmiPaise",
    "activeGoalMonthlyContributionPaise",
  ];

  for (const field of fields) {
    const value = partial[field];
    // undefined or null → missing. Zero is a valid explicit value.
    if (value === undefined || value === null) {
      return {
        status: "INCOMPLETE",
        missingField: field,
        missingFieldQuestion: FIELD_QUESTIONS[field],
      };
    }
  }

  // All required fields present — cast is safe.
  const context = partial as EmergencyContext;
  return { status: "COMPLETE", context };
}
