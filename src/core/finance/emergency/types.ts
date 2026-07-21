// ── Emergency Assist — Core Types ──
// Money values: integer paise.
// Dates: ISO YYYY-MM-DD.
// Stable reason codes: never rename without CONTRACT_CHANGELOG entry.

import type { IsoDate, Paise } from "../types";

// ── Emergency Category ──

export type EmergencyCategory =
  | "medical"
  | "family"
  | "housing"
  | "education"
  | "income_disruption"
  | "other";

// ── Consent ──

export type ConsentDecision =
  | "allow_once"
  | "decline"
  | "manual_entry"
  | "temporary_chat"
  | "delete_assessment";

export interface ConsentRequest {
  /** Which saved fields will be read if the user allows. */
  fieldsToUse: string[];
}

// ── Emergency Context ──

/**
 * All required inputs for the emergency affordability assessment.
 * Every field must be explicitly provided — never default missing values to zero.
 */
export interface EmergencyContext {
  /** What the money is needed for. */
  category: EmergencyCategory;
  /** Total amount needed in paise (e.g. hospital bill). */
  totalNeededPaise: Paise;
  /** Amount the user already has available for this emergency. */
  alreadyAvailablePaise: Paise;
  /** Date by which the money is required. */
  requiredByDate: IsoDate;
  /** Current account balance in paise. */
  currentBalancePaise: Paise;
  /** Monthly income in paise. */
  monthlyIncomePaise: Paise;
  /** Date of next income credit. */
  nextIncomeDate: IsoDate;
  /** Minimum balance to maintain at all times (protected floor). */
  protectedBalanceFloorPaise: Paise;
  /** Monthly protected expenses (rent, family transfer, etc.) in paise. */
  protectedMonthlyExpensesPaise: Paise;
  /** Total existing monthly EMI obligations in paise. */
  existingMonthlyEmiPaise: Paise;
  /** Active savings goal monthly contribution in paise (0 if none). */
  activeGoalMonthlyContributionPaise: Paise;
  /** Simulation reference date (today). */
  asOfDate: IsoDate;
}

/** Required field labels for the INCOMPLETE flow. */
export const EMERGENCY_CONTEXT_FIELD_LABELS: Record<
  keyof Omit<EmergencyContext, "category" | "asOfDate">,
  string
> = {
  totalNeededPaise: "total amount needed (₹)",
  alreadyAvailablePaise: "amount you already have available (₹)",
  requiredByDate: "date by which you need the money (YYYY-MM-DD)",
  currentBalancePaise: "your current account balance (₹)",
  monthlyIncomePaise: "your monthly income (₹)",
  nextIncomeDate: "your next income date (YYYY-MM-DD)",
  protectedBalanceFloorPaise: "minimum balance you want to keep (₹)",
  protectedMonthlyExpensesPaise: "total monthly protected expenses like rent (₹)",
  existingMonthlyEmiPaise: "total existing monthly EMI obligations (₹)",
  activeGoalMonthlyContributionPaise: "monthly savings goal contribution (₹, or 0 if none)",
};

// ── Context Validation ──

export type EmergencyContextStatus = "COMPLETE" | "INCOMPLETE";

export interface EmergencyContextResult {
  status: EmergencyContextStatus;
  /** The single missing field key, if INCOMPLETE. */
  missingField?: keyof EmergencyContext;
  /** Human-readable question to ask for the missing field. */
  missingFieldQuestion?: string;
  /** Populated context if COMPLETE. */
  context?: EmergencyContext;
}

// ── Reason Codes ──

export type EmergencyReasonCode =
  | "MISSING_INCOME"
  | "INCOME_UNVERIFIED"
  | "HIGH_EXISTING_EMI_RATIO"
  | "POST_LOAN_EMI_RATIO_EXCEEDED"
  | "NEGATIVE_BALANCE_PROJECTED"
  | "PROTECTED_BALANCE_BREACH"
  | "PROTECTED_EXPENSE_AT_RISK"
  | "INSUFFICIENT_REPAYMENT_BUFFER"
  | "GOAL_DELAYED"
  | "OFFER_TERMS_INCOMPLETE"
  | "PROVIDER_REVIEW_REQUIRED"
  | "AFFORDABILITY_FIT";

// ── Loan Offer Terms (explicit — never invented) ──

export interface ExplicitLoanOffer {
  /** Unique offer identifier. */
  id: string;
  /** Loan amount in paise. */
  principalPaise: Paise;
  /** Annual Percentage Rate in basis points (e.g. 1800 = 18%). */
  annualRateBasisPoints: number;
  /** Tenure in months. */
  tenureMonths: number;
  /** Processing fee in paise. */
  processingFeePaise: Paise;
  /** Any other upfront charges in paise. */
  otherChargesPaise: Paise;
  /** Expected disbursal window in calendar days. */
  disbursalWindowDays: number;
  /** Eligibility criteria stated by the simulated provider. */
  eligibilityCriteria: string[];
}

// ── Affordability Result Per Offer ──

export interface OfferAffordabilityResult {
  offerId: string;
  /** Calculated monthly EMI in integer paise (half-up rounding). */
  monthlyEmiPaise: Paise;
  /** Total fees (processing + other) in paise. */
  totalFeesPaise: Paise;
  /** Total amount repaid (principal + interest + fees) in paise. */
  totalRepaymentPaise: Paise;
  /** (existingEMI + newEMI) / monthlyIncome as basis points. */
  postLoanEmiRatioBasisPoints: number;
  /** Lowest projected account balance during loan horizon in paise. */
  lowestProjectedBalancePaise: Paise;
  /** Number of days projected balance goes negative. */
  negativeBalanceDays: number;
  /** True if projected balance breaches the protected floor. */
  protectedBalanceBreach: boolean;
  /** True if any protected expense cannot be met. */
  protectedExpenseAtRisk: boolean;
  /** Estimated delay to active savings goal in days (null if no goal). */
  goalDelayDays: number | null;
  /** ISO date of final repayment. */
  finalRepaymentDate: IsoDate;
  /** Ordered reason codes (severity, date, code). */
  reasonCodes: EmergencyReasonCode[];
}

// ── Emergency Affordability Input / Result ──

export interface EmergencyAffordabilityInput {
  context: EmergencyContext;
  /** Explicit loan offers to evaluate (from provider adapter). */
  offers: ExplicitLoanOffer[];
}

export interface EmergencyAffordabilityResult {
  /** Calculated gap = totalNeeded − alreadyAvailable (min 0). */
  fundingGapPaise: Paise;
  /** Per-offer affordability results. */
  offerResults: OfferAffordabilityResult[];
  /** Simulation reference date used. */
  asOfDate: IsoDate;
}

// ── Offer Comparison ──

export interface EmergencyOfferComparison {
  /** Sorted by total repayment ascending (lowest cost first). */
  offers: OfferAffordabilityResult[];
  /** Funding gap amount. */
  fundingGapPaise: Paise;
}

// ── Insurance Boundary ──

export type NonCreditAlternative =
  | "existing_insurance_claim"
  | "hospital_payment_plan"
  | "employer_salary_advance"
  | "family_support"
  | "government_charity_scheme"
  | "regulated_credit_simulation";

export interface InsuranceBoundaryResult {
  /** True = emergency already happened; new insurance cannot cover it. */
  newInsuranceInapplicable: boolean;
  /** Neutral alternatives to present. */
  applicableAlternatives: NonCreditAlternative[];
  /** Future prevention roadmap is separate and optional. */
  preventionRoadmapOnly: boolean;
}
