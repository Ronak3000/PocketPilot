import { addMonthsClamped, dateParts } from "../dates/date-utils";
import { addPaise, multiplyPaise } from "../money/money";
import type { EmiCommitmentResult, PurchaseProposal } from "../types";
import { calculateEmi } from "./calculate-emi";
import { validateEmiOffer } from "./validate-emi-offer";

export function calculateTotalCommitment(
  proposal: PurchaseProposal,
): EmiCommitmentResult {
  validateEmiOffer(proposal);
  const principalFinancedPaise = proposal.listedPricePaise - proposal.downPaymentPaise;
  const installmentCount = proposal.tenureMonths ?? 0;
  const monthlyEmiPaise =
    proposal.monthlyEmiPaise ??
    (principalFinancedPaise > 0
      ? calculateEmi({
          principalPaise: principalFinancedPaise,
          tenureMonths: installmentCount,
          annualInterestBasisPoints: proposal.annualInterestBasisPoints,
          monthlyInterestBasisPoints: proposal.monthlyInterestBasisPoints,
        }).monthlyEmiPaise
      : 0);
  const totalInstallmentCommitmentPaise = multiplyPaise(
    monthlyEmiPaise,
    installmentCount,
  );
  const preferredDay = dateParts(proposal.purchaseDate).day;
  return {
    principalFinancedPaise,
    monthlyEmiPaise,
    installmentCount,
    totalInstallmentCommitmentPaise,
    downPaymentPaise: proposal.downPaymentPaise,
    processingFeePaise: proposal.processingFeePaise,
    totalCommittedCostPaise: addPaise(
      proposal.downPaymentPaise,
      proposal.processingFeePaise,
      totalInstallmentCommitmentPaise,
    ),
    firstEmiDate:
      installmentCount > 0
        ? addMonthsClamped(proposal.purchaseDate, 1, preferredDay)
        : null,
    commitmentEndingDate:
      installmentCount > 0
        ? addMonthsClamped(proposal.purchaseDate, installmentCount, preferredDay)
        : null,
  };
}
