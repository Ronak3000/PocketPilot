// ── Insurance Boundary ──
// If the emergency already happened, new insurance cannot cover it.
// Lists only neutral non-credit alternatives.

import type {
  InsuranceBoundaryResult,
  NonCreditAlternative,
} from "./types";

/**
 * Determines the insurance boundary for an emergency.
 * Always returns new-insurance as inapplicable for past emergencies.
 * Lists neutral non-credit alternatives without ranking by favorability.
 *
 * PocketPilot does not sell insurance.
 */
export function checkInsuranceBoundary(params: {
  /** True when the emergency has already occurred (bill in hand). */
  emergencyAlreadyOccurred: boolean;
  /** Whether the user has mentioned an existing insurance policy. */
  hasExistingInsurance: boolean;
}): InsuranceBoundaryResult {
  const { emergencyAlreadyOccurred, hasExistingInsurance } = params;

  const alternatives: NonCreditAlternative[] = [];

  if (emergencyAlreadyOccurred) {
    // Only show claim review if they mentioned having insurance
    if (hasExistingInsurance) {
      alternatives.push("existing_insurance_claim");
    }
    alternatives.push("hospital_payment_plan");
    alternatives.push("employer_salary_advance");
    alternatives.push("family_support");
    alternatives.push("government_charity_scheme");
    alternatives.push("regulated_credit_simulation");
  } else {
    // Future emergency — all options including new insurance (as prevention only)
    alternatives.push("hospital_payment_plan");
    alternatives.push("employer_salary_advance");
    alternatives.push("family_support");
    alternatives.push("government_charity_scheme");
    alternatives.push("regulated_credit_simulation");
  }

  return {
    newInsuranceInapplicable: emergencyAlreadyOccurred,
    applicableAlternatives: alternatives,
    // Future insurance can only appear as a separate prevention roadmap
    preventionRoadmapOnly: emergencyAlreadyOccurred,
  };
}

/** Human-readable labels for non-credit alternatives. */
export const NON_CREDIT_ALTERNATIVE_LABELS: Record<NonCreditAlternative, string> = {
  existing_insurance_claim:
    "Review your existing health/accident insurance for a claim",
  hospital_payment_plan:
    "Ask the hospital about a deferred or installment payment plan",
  employer_salary_advance:
    "Request a salary advance from your employer",
  family_support:
    "Discuss temporary support with a trusted family member",
  government_charity_scheme:
    "Check for applicable government schemes or charitable assistance",
  regulated_credit_simulation:
    "Explore regulated credit options (simulation — not an approval)",
};
