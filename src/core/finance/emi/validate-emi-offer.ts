import { toEpochDay } from "../dates/date-utils";
import { FinanceError } from "../errors";
import { assertNonNegativePaise } from "../money/money";
import type { PurchaseProposal } from "../types";

export function validateEmiOffer(proposal: PurchaseProposal): true {
  assertNonNegativePaise(proposal.listedPricePaise, "listedPricePaise");
  assertNonNegativePaise(proposal.downPaymentPaise, "downPaymentPaise");
  assertNonNegativePaise(proposal.processingFeePaise, "processingFeePaise");
  toEpochDay(proposal.purchaseDate);
  if (proposal.downPaymentPaise > proposal.listedPricePaise) {
    throw new FinanceError("INVALID_INPUT", "down payment cannot exceed listed price");
  }

  const financedPaise = proposal.listedPricePaise - proposal.downPaymentPaise;
  if (financedPaise === 0) {
    if ((proposal.monthlyEmiPaise ?? 0) !== 0 || (proposal.tenureMonths ?? 0) !== 0) {
      throw new FinanceError("INVALID_INPUT", "a fully paid purchase cannot include installments");
    }
    return true;
  }

  if (
    !Number.isSafeInteger(proposal.tenureMonths) ||
    (proposal.tenureMonths ?? 0) <= 0 ||
    (proposal.tenureMonths ?? 0) > 1_200
  ) {
    throw new FinanceError("MISSING_CONTEXT", "financed purchase requires tenureMonths", {
      missingFields: ["tenureMonths"],
    });
  }
  if (proposal.monthlyEmiPaise !== undefined) {
    assertNonNegativePaise(proposal.monthlyEmiPaise, "monthlyEmiPaise");
    if (proposal.monthlyEmiPaise === 0) {
      throw new FinanceError("INVALID_INPUT", "monthlyEmiPaise must be positive when financed");
    }
    return true;
  }
  if (
    proposal.annualInterestBasisPoints === undefined &&
    proposal.monthlyInterestBasisPoints === undefined
  ) {
    throw new FinanceError("MISSING_CONTEXT", "financed purchase requires EMI or interest rate", {
      missingFields: ["monthlyEmiPaise", "annualInterestBasisPoints"],
    });
  }
  return true;
}
