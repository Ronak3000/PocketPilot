// ── Emergency Finance Module — Public API ──
// Exports only the five public functions and all types.
// Internal helpers remain private to each module.

export { assessEmergencyAffordability } from "./assess-affordability";
export { compareEmergencyFundingOffers } from "./compare-offers";
export { validateEmergencyContext } from "./validate-context";
export { checkInsuranceBoundary, NON_CREDIT_ALTERNATIVE_LABELS } from "./insurance-boundary";
export { EMERGENCY_CONTEXT_FIELD_LABELS } from "./types";
export type {
  EmergencyCategory,
  EmergencyContext,
  EmergencyContextResult,
  EmergencyAffordabilityInput,
  EmergencyAffordabilityResult,
  EmergencyOfferComparison,
  EmergencyReasonCode,
  ExplicitLoanOffer,
  OfferAffordabilityResult,
  InsuranceBoundaryResult,
  NonCreditAlternative,
  ConsentDecision,
  ConsentRequest,
} from "./types";
