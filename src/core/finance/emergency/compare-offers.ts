// ── Emergency Offer Comparison ──
// Sorts offers by total repayment (lowest cost first).
// Does NOT rank by commission, provider, or emotional factors.

import { assessEmergencyAffordability } from "./assess-affordability";
import type {
  EmergencyAffordabilityInput,
  EmergencyOfferComparison,
} from "./types";

/**
 * Compares funding offers for a financial emergency.
 * Ordered by total repayment amount ascending (lowest total cost first).
 * Each offer result includes reason codes, EMI, fees, risk indicators.
 */
export function compareEmergencyFundingOffers(
  input: EmergencyAffordabilityInput,
): EmergencyOfferComparison {
  const result = assessEmergencyAffordability(input);

  const sorted = [...result.offerResults].sort(
    (a, b) => a.totalRepaymentPaise - b.totalRepaymentPaise,
  );

  return {
    offers: sorted,
    fundingGapPaise: result.fundingGapPaise,
  };
}
