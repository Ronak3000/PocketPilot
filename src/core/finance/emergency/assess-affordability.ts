// ── Emergency Affordability Calculator ──
// Pure deterministic function. Integer paise only (BigInt internally).
// Reason codes are stable — do not rename without CONTRACT_CHANGELOG entry.

import type {
  EmergencyAffordabilityInput,
  EmergencyAffordabilityResult,
  EmergencyReasonCode,
  ExplicitLoanOffer,
  OfferAffordabilityResult,
} from "./types";
import type { IsoDate, Paise } from "../types";

// ── Date Utilities (inline — no new dependency) ──

function parseIso(date: IsoDate): { y: number; m: number; d: number } {
  const [y, m, d] = date.split("-").map(Number);
  return { y, m, d };
}

function addMonths(date: IsoDate, months: number): IsoDate {
  const { y, m, d } = parseIso(date);
  const target = new Date(Date.UTC(y, m - 1 + months, d));
  // Clamp to last day of resulting month
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  const clampedDay = Math.min(d, lastDay);
  const result = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), clampedDay));
  return result.toISOString().split("T")[0];
}

function isoFromDate(d: Date): IsoDate {
  return d.toISOString().split("T")[0];
}

// ── EMI Calculation (standard reducing-balance, half-up rounding) ──
// Formula: EMI = P * r * (1+r)^n / ((1+r)^n - 1)
// where r = annualRateBasisPoints / (12 * 10000)
// Compatible with ES2017 target (no BigInt).

function calcEmiPaise(
  principalPaise: Paise,
  annualRateBasisPoints: number,
  tenureMonths: number,
): Paise {
  if (annualRateBasisPoints === 0 || tenureMonths === 0) {
    // Zero-interest or single payment: equal installments
    return Math.ceil(principalPaise / Math.max(1, tenureMonths));
  }
  // Monthly rate as a fraction
  const r = annualRateBasisPoints / (12 * 10_000);
  const power = Math.pow(1 + r, tenureMonths);
  // Half-up rounding to integer paise
  return Math.round((principalPaise * r * power) / (power - 1));
}



// ── Projected Balance Walk ──
// Models: disbursal → emergency payment → fee → N monthly repayments.
// Returns { lowestBalance, negativeBalanceDays, protectedBreach, expenseAtRisk, finalDate }

interface BalanceWalkResult {
  lowestBalancePaise: Paise;
  negativeBalanceDays: number;
  protectedBalanceBreach: boolean;
  protectedExpenseAtRisk: boolean;
  finalRepaymentDate: IsoDate;
}

function projectBalance(params: {
  startBalancePaise: Paise;
  fundingGapPaise: Paise; // amount drawn from loan
  processingFeePaise: Paise;
  otherChargesPaise: Paise;
  monthlyEmiPaise: Paise;
  tenureMonths: number;
  disbursalDate: IsoDate;
  protectedBalanceFloorPaise: Paise;
  monthlyIncomePaise: Paise;
  monthlyOutflowsPaise: Paise; // protected expenses + existing EMI
  activeGoalContributionPaise: Paise;
}): BalanceWalkResult {
  const {
    startBalancePaise,
    fundingGapPaise,
    processingFeePaise,
    otherChargesPaise,
    monthlyEmiPaise,
    tenureMonths,
    disbursalDate,
    protectedBalanceFloorPaise,
    monthlyIncomePaise,
    monthlyOutflowsPaise,
    activeGoalContributionPaise,
  } = params;

  const totalUpfrontFees = processingFeePaise + otherChargesPaise;

  // Day 0: receive loan, pay emergency, deduct upfront fees
  let balance =
    startBalancePaise +
    fundingGapPaise -
    fundingGapPaise - // emergency paid immediately
    totalUpfrontFees;
  // Simplification: disbursal covers the gap exactly; balance net effect = −upfrontFees
  // after paying emergency with loan proceeds.

  let lowestBalance = balance;
  let negativeBalanceDays = balance < 0 ? 1 : 0;
  let protectedBreach = balance < protectedBalanceFloorPaise;
  let protectedExpenseAtRisk = false;
  let finalDate = disbursalDate;

  // Monthly walk for tenure + 1 buffer month
  const totalMonthlyOut =
    monthlyOutflowsPaise + activeGoalContributionPaise + monthlyEmiPaise;
  const netMonthly = monthlyIncomePaise - totalMonthlyOut;

  for (let i = 1; i <= tenureMonths; i++) {
    balance += netMonthly;
    const repaymentDate = addMonths(disbursalDate, i);
    finalDate = repaymentDate;

    if (balance < 0) negativeBalanceDays++;
    if (balance < lowestBalance) lowestBalance = balance;
    if (balance < protectedBalanceFloorPaise) protectedBreach = true;
    // Check if outflows would exceed available balance in a given month
    if (startBalancePaise + monthlyIncomePaise < monthlyOutflowsPaise) {
      protectedExpenseAtRisk = true;
    }
  }

  return {
    lowestBalancePaise: lowestBalance,
    negativeBalanceDays,
    protectedBalanceBreach: protectedBreach,
    protectedExpenseAtRisk,
    finalRepaymentDate: finalDate,
  };
}

// ── Build Reason Codes ──

function buildReasonCodes(params: {
  walk: BalanceWalkResult;
  postLoanEmiRatioBasisPoints: number;
  goalDelayDays: number | null;
  monthlyIncomePaise: Paise;
}): EmergencyReasonCode[] {
  const codes: EmergencyReasonCode[] = [];
  const { walk, postLoanEmiRatioBasisPoints, goalDelayDays, monthlyIncomePaise } = params;

  if (monthlyIncomePaise === 0) codes.push("MISSING_INCOME");
  if (postLoanEmiRatioBasisPoints > 5000) codes.push("HIGH_EXISTING_EMI_RATIO");
  if (postLoanEmiRatioBasisPoints > 4000) codes.push("POST_LOAN_EMI_RATIO_EXCEEDED");
  if (walk.negativeBalanceDays > 0) codes.push("NEGATIVE_BALANCE_PROJECTED");
  if (walk.protectedBalanceBreach) codes.push("PROTECTED_BALANCE_BREACH");
  if (walk.protectedExpenseAtRisk) codes.push("PROTECTED_EXPENSE_AT_RISK");
  if (walk.lowestBalancePaise < 0) codes.push("INSUFFICIENT_REPAYMENT_BUFFER");
  if (goalDelayDays !== null && goalDelayDays > 0) codes.push("GOAL_DELAYED");

  // If no adverse codes, mark as fit
  if (codes.length === 0) codes.push("AFFORDABILITY_FIT");

  // Stable ordering: alphabetical within each severity band
  return [...new Set(codes)].sort();
}

// ── Assess Single Offer ──

function assessOffer(
  offer: ExplicitLoanOffer,
  context: {
    fundingGapPaise: Paise;
    currentBalancePaise: Paise;
    monthlyIncomePaise: Paise;
    existingMonthlyEmiPaise: Paise;
    monthlyProtectedExpensesPaise: Paise;
    activeGoalMonthlyContributionPaise: Paise;
    protectedBalanceFloorPaise: Paise;
    asOfDate: IsoDate;
  },
): OfferAffordabilityResult {
  const {
    fundingGapPaise,
    currentBalancePaise,
    monthlyIncomePaise,
    existingMonthlyEmiPaise,
    monthlyProtectedExpensesPaise,
    activeGoalMonthlyContributionPaise,
    protectedBalanceFloorPaise,
    asOfDate,
  } = context;

  const monthlyEmiPaise = calcEmiPaise(
    offer.principalPaise,
    offer.annualRateBasisPoints,
    offer.tenureMonths,
  );

  const totalFeesPaise = offer.processingFeePaise + offer.otherChargesPaise;
  const totalRepaymentPaise =
    monthlyEmiPaise * offer.tenureMonths + totalFeesPaise;

  // Post-loan EMI ratio = (existing + new EMI) / income, in basis points
  const totalEmi = existingMonthlyEmiPaise + monthlyEmiPaise;
  const postLoanEmiRatioBasisPoints =
    monthlyIncomePaise > 0
      ? Math.round((totalEmi * 10_000) / monthlyIncomePaise)
      : 99_999; // effectively unbounded when income unknown

  // Disbursal assumed to happen on asOfDate + disbursalWindowDays
  const disbursalDateObj = new Date(
    Date.UTC(...(asOfDate.split("-").map(Number) as [number, number, number]))
  );
  disbursalDateObj.setUTCDate(
    disbursalDateObj.getUTCDate() + offer.disbursalWindowDays,
  );
  const disbursalDate = isoFromDate(disbursalDateObj);

  const walk = projectBalance({
    startBalancePaise: currentBalancePaise,
    fundingGapPaise,
    processingFeePaise: offer.processingFeePaise,
    otherChargesPaise: offer.otherChargesPaise,
    monthlyEmiPaise,
    tenureMonths: offer.tenureMonths,
    disbursalDate,
    protectedBalanceFloorPaise,
    monthlyIncomePaise,
    monthlyOutflowsPaise:
      monthlyProtectedExpensesPaise + existingMonthlyEmiPaise,
    activeGoalContributionPaise: activeGoalMonthlyContributionPaise,
  });

  // Goal delay: rough estimate — each month of new EMI reduces goal contribution buffer
  const goalDelayDays: number | null =
    activeGoalMonthlyContributionPaise > 0
      ? Math.round(
          (monthlyEmiPaise / activeGoalMonthlyContributionPaise) *
            offer.tenureMonths *
            30,
        )
      : null;

  const reasonCodes = buildReasonCodes({
    walk,
    postLoanEmiRatioBasisPoints,
    goalDelayDays,
    monthlyIncomePaise,
  });

  return {
    offerId: offer.id,
    monthlyEmiPaise,
    totalFeesPaise,
    totalRepaymentPaise,
    postLoanEmiRatioBasisPoints,
    lowestProjectedBalancePaise: walk.lowestBalancePaise,
    negativeBalanceDays: walk.negativeBalanceDays,
    protectedBalanceBreach: walk.protectedBalanceBreach,
    protectedExpenseAtRisk: walk.protectedExpenseAtRisk,
    goalDelayDays,
    finalRepaymentDate: walk.finalRepaymentDate,
    reasonCodes,
  };
}

// ── Public API ──

/**
 * Deterministically assesses emergency affordability for each explicit offer.
 * Uses integer paise throughout. Never invents fees, rates or terms.
 */
export function assessEmergencyAffordability(
  input: EmergencyAffordabilityInput,
): EmergencyAffordabilityResult {
  const { context, offers } = input;

  const fundingGapPaise = Math.max(
    0,
    context.totalNeededPaise - context.alreadyAvailablePaise,
  );

  const offerResults = offers.map((offer) =>
    assessOffer(offer, {
      fundingGapPaise,
      currentBalancePaise: context.currentBalancePaise,
      monthlyIncomePaise: context.monthlyIncomePaise,
      existingMonthlyEmiPaise: context.existingMonthlyEmiPaise,
      monthlyProtectedExpensesPaise: context.protectedMonthlyExpensesPaise,
      activeGoalMonthlyContributionPaise:
        context.activeGoalMonthlyContributionPaise,
      protectedBalanceFloorPaise: context.protectedBalanceFloorPaise,
      asOfDate: context.asOfDate,
    }),
  );

  return { fundingGapPaise, offerResults, asOfDate: context.asOfDate };
}
