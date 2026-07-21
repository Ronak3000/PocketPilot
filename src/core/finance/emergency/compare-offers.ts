// ── Emergency Offer Comparison ──
// Sorts offers by safety first, then total repayment.
// Does NOT rank by commission, provider, or emotional factors.

import { assessEmergencyAffordability } from "./assess-affordability";
import type {
  EmergencyAffordabilityInput,
  EmergencyOfferComparison,
} from "./types";

/**
 * Compares funding offers for a financial emergency.
 * Ordered by deadline, balance safety, Constitution compliance, then cost.
 * Each offer result includes reason codes, EMI, fees, risk indicators.
 */
export function compareEmergencyFundingOffers(
  input: EmergencyAffordabilityInput,
): EmergencyOfferComparison {
  const result = assessEmergencyAffordability(input);

  const sorted = [...result.offerResults].sort((a, b) => {
    const left = [
      Number(!a.arrivesByRequiredDate),
      Number(a.negativeBalanceDays > 0),
      Number(a.protectedExpenseAtRisk || a.protectedBalanceBreach),
      Number(!a.constitutionCompliant),
    ];
    const right = [
      Number(!b.arrivesByRequiredDate),
      Number(b.negativeBalanceDays > 0),
      Number(b.protectedExpenseAtRisk || b.protectedBalanceBreach),
      Number(!b.constitutionCompliant),
    ];
    for (let index = 0; index < left.length; index++) {
      if (left[index] !== right[index]) return left[index] - right[index];
    }
    return (
      a.totalRepaymentPaise - b.totalRepaymentPaise ||
      a.offerId.localeCompare(b.offerId)
    );
  });

  return {
    offers: sorted,
    fundingGapPaise: result.fundingGapPaise,
  };
}
