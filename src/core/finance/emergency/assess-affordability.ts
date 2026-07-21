import { calculateMinimumBalance } from "../cashflow/calculate-minimum-balance";
import { calculateRiskDays } from "../cashflow/calculate-risk-days";
import { addDays, addMonthsClamped, compareIsoDates } from "../dates/date-utils";
import { calculateEmi } from "../emi/calculate-emi";
import { calculateEmiRatio } from "../emi/calculate-emi-ratio";
import { FinanceError } from "../errors";
import { calculateGoalDelay } from "../goals/calculate-goal-delay";
import {
  addPaise,
  assertNonNegativePaise,
  multiplyPaise,
} from "../money/money";
import type { Paise } from "../types";
import { buildEmergencyLedger } from "./build-emergency-ledger";
import type {
  EmergencyAffordabilityInput,
  EmergencyAffordabilityResult,
  EmergencyContext,
  EmergencyReasonCode,
  ExplicitLoanOffer,
  OfferAffordabilityResult,
} from "./types";

function validateContext(context: EmergencyContext): void {
  const moneyFields = [
    "totalNeededPaise",
    "alreadyAvailablePaise",
    "currentBalancePaise",
    "monthlyIncomePaise",
    "protectedBalanceFloorPaise",
    "protectedMonthlyExpensesPaise",
    "existingMonthlyEmiPaise",
    "activeGoalMonthlyContributionPaise",
  ] as const;
  for (const field of moneyFields) assertNonNegativePaise(context[field], field);
  if (compareIsoDates(context.requiredByDate, context.asOfDate) < 0) {
    throw new FinanceError("INVALID_DATE_RANGE", "requiredByDate must not precede asOfDate");
  }
  if (compareIsoDates(context.nextIncomeDate, context.asOfDate) < 0) {
    throw new FinanceError("INVALID_DATE_RANGE", "nextIncomeDate must not precede asOfDate");
  }
  if (
    context.maximumEmiRatioBasisPoints !== undefined &&
    (!Number.isSafeInteger(context.maximumEmiRatioBasisPoints) ||
      context.maximumEmiRatioBasisPoints < 0)
  ) {
    throw new FinanceError("INVALID_INPUT", "maximumEmiRatioBasisPoints is invalid");
  }
  if (
    context.maximumTenureMonths !== undefined &&
    (!Number.isSafeInteger(context.maximumTenureMonths) || context.maximumTenureMonths <= 0)
  ) {
    throw new FinanceError("INVALID_INPUT", "maximumTenureMonths is invalid");
  }
}

function validateOffer(offer: ExplicitLoanOffer, fundingGapPaise: Paise): void {
  assertNonNegativePaise(offer.principalPaise, "offer.principalPaise");
  assertNonNegativePaise(offer.processingFeePaise, "offer.processingFeePaise");
  assertNonNegativePaise(offer.otherChargesPaise, "offer.otherChargesPaise");
  if (offer.principalPaise !== fundingGapPaise) {
    throw new FinanceError("INVALID_INPUT", "offer principal must equal the funding gap", {
      offerId: offer.id,
      fundingGapPaise,
      principalPaise: offer.principalPaise,
    });
  }
  if (!Number.isSafeInteger(offer.disbursalWindowDays) || offer.disbursalWindowDays < 0) {
    throw new FinanceError("INVALID_INPUT", "disbursalWindowDays must be non-negative");
  }
}

function buildReasonCodes(params: {
  context: EmergencyContext;
  offer: ExplicitLoanOffer;
  arrivesByRequiredDate: boolean;
  emiRatioBasisPoints: number;
  negativeBalanceDays: number;
  protectedBalanceBreach: boolean;
  protectedExpenseAtRisk: boolean;
  goalDelayDays: number | null;
}): EmergencyReasonCode[] {
  const { context, offer } = params;
  const codes: EmergencyReasonCode[] = [];
  if (context.monthlyIncomePaise === 0) codes.push("MISSING_INCOME");
  if (!params.arrivesByRequiredDate) codes.push("DISBURSAL_AFTER_REQUIRED_DATE");
  if (
    context.maximumEmiRatioBasisPoints !== undefined &&
    params.emiRatioBasisPoints > context.maximumEmiRatioBasisPoints
  ) codes.push("POST_LOAN_EMI_RATIO_EXCEEDED");
  if (
    context.maximumTenureMonths !== undefined &&
    offer.tenureMonths > context.maximumTenureMonths
  ) codes.push("EMI_DURATION_EXCEEDED");
  if (params.negativeBalanceDays > 0) codes.push("NEGATIVE_BALANCE_PROJECTED");
  if (params.protectedBalanceBreach) codes.push("PROTECTED_BALANCE_BREACH");
  if (params.protectedExpenseAtRisk) codes.push("PROTECTED_EXPENSE_AT_RISK");
  if (params.goalDelayDays !== null && params.goalDelayDays > 0) codes.push("GOAL_DELAYED");
  if (codes.length === 0) codes.push("AFFORDABILITY_FIT");
  return codes.sort();
}

function assessOffer(
  context: EmergencyContext,
  offer: ExplicitLoanOffer,
  fundingGapPaise: Paise,
): OfferAffordabilityResult {
  validateOffer(offer, fundingGapPaise);
  const monthlyEmiPaise = calculateEmi({
    principalPaise: offer.principalPaise,
    tenureMonths: offer.tenureMonths,
    annualInterestBasisPoints: offer.annualRateBasisPoints,
  }).monthlyEmiPaise;
  const totalFeesPaise = addPaise(offer.processingFeePaise, offer.otherChargesPaise);
  const totalRepaymentPaise = addPaise(
    multiplyPaise(monthlyEmiPaise, offer.tenureMonths),
    totalFeesPaise,
  );
  const postLoanEmiRatioBasisPoints =
    context.monthlyIncomePaise === 0
      ? 99_999
      : calculateEmiRatio({
          monthlyIncomePaise: context.monthlyIncomePaise,
          existingMonthlyEmiPaise: context.existingMonthlyEmiPaise,
          newMonthlyEmiPaise: monthlyEmiPaise,
        }).totalEmiBasisPoints;
  const disbursalDate = addDays(context.asOfDate, offer.disbursalWindowDays);
  const finalRepaymentDate = addMonthsClamped(disbursalDate, offer.tenureMonths);
  const ledger = buildEmergencyLedger({
    context,
    offer,
    monthlyEmiPaise,
    disbursalDate,
    finalRepaymentDate,
  });
  const minimum = calculateMinimumBalance(ledger);
  const risk = calculateRiskDays(ledger, context.protectedBalanceFloorPaise);
  const protectedExpenseAtRisk = ledger.some(
    (day) =>
      day.closingBalancePaise < 0 && day.appliedEvents.some((event) => event.protected),
  );
  const missedGoalPeriods = ledger.filter(
    (day) =>
      day.closingBalancePaise < 0 &&
      day.appliedEvents.some((event) => event.kind === "goal_contribution"),
  ).length;
  const goalDelayDays = context.activeGoal
    ? calculateGoalDelay({
        goal: {
          ...context.activeGoal,
          monthlyContributionPaise: context.activeGoalMonthlyContributionPaise,
          startDate: context.asOfDate,
        },
        missedContributionPeriods: missedGoalPeriods,
      }).goalDelayDays
    : null;
  const arrivesByRequiredDate = compareIsoDates(disbursalDate, context.requiredByDate) <= 0;
  const protectedBalanceBreach = minimum.minimumBalancePaise < context.protectedBalanceFloorPaise;
  const constitutionCompliant =
    (context.maximumEmiRatioBasisPoints === undefined ||
      postLoanEmiRatioBasisPoints <= context.maximumEmiRatioBasisPoints) &&
    (context.maximumTenureMonths === undefined || offer.tenureMonths <= context.maximumTenureMonths);
  const reasonCodes = buildReasonCodes({
    context,
    offer,
    arrivesByRequiredDate,
    emiRatioBasisPoints: postLoanEmiRatioBasisPoints,
    negativeBalanceDays: risk.negativeBalanceDays,
    protectedBalanceBreach,
    protectedExpenseAtRisk,
    goalDelayDays,
  });
  return {
    offerId: offer.id,
    monthlyEmiPaise,
    totalFeesPaise,
    totalRepaymentPaise,
    postLoanEmiRatioBasisPoints,
    lowestProjectedBalancePaise: minimum.minimumBalancePaise,
    negativeBalanceDays: risk.negativeBalanceDays,
    protectedBalanceBreach,
    protectedExpenseAtRisk,
    goalDelayDays,
    finalRepaymentDate,
    disbursalDate,
    arrivesByRequiredDate,
    constitutionCompliant,
    reasonCodes,
  };
}

export function assessEmergencyAffordability(
  input: EmergencyAffordabilityInput,
): EmergencyAffordabilityResult {
  validateContext(input.context);
  const fundingGapPaise = Math.max(
    0,
    input.context.totalNeededPaise - input.context.alreadyAvailablePaise,
  );
  return {
    fundingGapPaise,
    offerResults: input.offers.map((offer) => assessOffer(input.context, offer, fundingGapPaise)),
    asOfDate: input.context.asOfDate,
  };
}
