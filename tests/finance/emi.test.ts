import { describe, expect, it } from "vitest";
import { calculateEmi } from "../../src/core/finance/emi/calculate-emi";
import { calculateEmiRatio } from "../../src/core/finance/emi/calculate-emi-ratio";
import { calculateTotalCommitment } from "../../src/core/finance/emi/calculate-total-commitment";
import { validateEmiOffer } from "../../src/core/finance/emi/validate-emi-offer";
import type { PurchaseProposal } from "../../src/core/finance/types";

const aaravPhone: PurchaseProposal = {
  id: "phone",
  title: "Phone",
  listedPricePaise: 5_999_900,
  purchaseDate: "2026-08-15",
  downPaymentPaise: 1_200_000,
  processingFeePaise: 149_900,
  monthlyEmiPaise: 450_000,
  tenureMonths: 12,
};

describe("EMI calculations", () => {
  it("calculates zero-interest and annual-rate EMI with half-up rounding", () => {
    expect(
      calculateEmi({
        principalPaise: 1_200_000,
        tenureMonths: 12,
        annualInterestBasisPoints: 0,
      }),
    ).toEqual({
      monthlyEmiPaise: 100_000,
      monthlyInterestBasisPoints: 0,
      rounding: "half-up",
    });
    expect(
      calculateEmi({
        principalPaise: 10_000_000,
        tenureMonths: 12,
        annualInterestBasisPoints: 1_200,
      }).monthlyEmiPaise,
    ).toBe(888_488);
  });

  it("does not double-count financed principal", () => {
    expect(calculateTotalCommitment(aaravPhone)).toEqual({
      principalFinancedPaise: 4_799_900,
      monthlyEmiPaise: 450_000,
      installmentCount: 12,
      totalInstallmentCommitmentPaise: 5_400_000,
      downPaymentPaise: 1_200_000,
      processingFeePaise: 149_900,
      totalCommittedCostPaise: 6_749_900,
      firstEmiDate: "2026-09-15",
      commitmentEndingDate: "2027-08-15",
    });
  });

  it("calculates existing, new, and combined burden", () => {
    expect(
      calculateEmiRatio({
        monthlyIncomePaise: 4_800_000,
        existingMonthlyEmiPaise: 350_000,
        newMonthlyEmiPaise: 450_000,
      }),
    ).toEqual({
      existingEmiBasisPoints: 729,
      newEmiBasisPoints: 938,
      totalEmiBasisPoints: 1_667,
    });
  });

  it("validates cash and financed offers without inventing terms", () => {
    expect(
      validateEmiOffer({
        ...aaravPhone,
        listedPricePaise: 3_999_900,
        downPaymentPaise: 3_999_900,
        processingFeePaise: 0,
        monthlyEmiPaise: undefined,
        tenureMonths: undefined,
      }),
    ).toBe(true);
    expect(() =>
      validateEmiOffer({
        ...aaravPhone,
        monthlyEmiPaise: undefined,
        annualInterestBasisPoints: undefined,
      }),
    ).toThrowError(expect.objectContaining({ code: "MISSING_CONTEXT" }));
  });

  it("clamps first and final EMI dates at month end", () => {
    expect(
      calculateTotalCommitment({
        ...aaravPhone,
        purchaseDate: "2026-01-31",
        tenureMonths: 2,
      }),
    ).toMatchObject({
      firstEmiDate: "2026-02-28",
      commitmentEndingDate: "2026-03-31",
    });
  });
});
