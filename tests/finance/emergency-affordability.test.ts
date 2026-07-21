import { describe, expect, it } from "vitest";
import {
  assessEmergencyAffordability,
  compareEmergencyFundingOffers,
  type EmergencyContext,
  type ExplicitLoanOffer,
} from "@/core/finance/emergency";
import fixture from "../fixtures/aarav-emergency-funding.json";

const CONTEXT: EmergencyContext = {
  category: "medical",
  totalNeededPaise: fixture.emergency.totalNeededPaise,
  alreadyAvailablePaise: fixture.emergency.alreadyAvailablePaise,
  requiredByDate: fixture.emergency.requiredByDate,
  currentBalancePaise: fixture.profile.currentBalancePaise,
  monthlyIncomePaise: fixture.profile.monthlyIncomePaise,
  nextIncomeDate: fixture.profile.nextIncomeDate,
  protectedBalanceFloorPaise: fixture.profile.protectedBalanceFloorPaise,
  protectedMonthlyExpensesPaise: fixture.profile.protectedMonthlyExpensesPaise,
  existingMonthlyEmiPaise: fixture.profile.existingMonthlyEmiPaise,
  activeGoalMonthlyContributionPaise: fixture.profile.activeGoalMonthlyContributionPaise,
  activeGoal: {
    id: "emergency-fund",
    targetAmountPaise: 15_000_000,
    currentAmountPaise: 12_400_000,
    contributionDayOfMonth: 1,
  },
  maximumEmiRatioBasisPoints: 4_000,
  maximumTenureMonths: 24,
  asOfDate: fixture.assumptions.asOfDate,
};

const OFFERS: ExplicitLoanOffer[] = fixture.mockOffers.map((offer) => ({
  ...offer,
  eligibilityCriteria: [],
}));

describe("emergency affordability", () => {
  it("calculates the funding gap and deducts the user's available contribution", () => {
    const result = assessEmergencyAffordability({ context: CONTEXT, offers: [OFFERS[0]] });
    expect(result.fundingGapPaise).toBe(10_000_000);
    expect(result.offerResults[0].lowestProjectedBalancePaise).toBe(5_100_000);
  });

  it("returns a zero gap without inventing a loan offer", () => {
    const result = assessEmergencyAffordability({
      context: { ...CONTEXT, alreadyAvailablePaise: 15_000_000 },
      offers: [],
    });
    expect(result).toMatchObject({ fundingGapPaise: 0, offerResults: [] });
  });

  it("rejects an offer whose principal does not equal the verified gap", () => {
    expect(() => assessEmergencyAffordability({
      context: CONTEXT,
      offers: [{ ...OFFERS[0], principalPaise: 9_000_000 }],
    })).toThrow(/principal must equal the funding gap/i);
  });

  it("uses timezone-safe calendar dates for disbursal and final repayment", () => {
    const result = assessEmergencyAffordability({ context: CONTEXT, offers: [OFFERS[0]] })
      .offerResults[0];
    expect(result.disbursalDate).toBe("2026-08-18");
    expect(result.finalRepaymentDate).toBe("2028-02-18");
    expect(result.arrivesByRequiredDate).toBe(true);
  });

  it("clamps a month-end repayment schedule correctly", () => {
    const context = {
      ...CONTEXT,
      asOfDate: "2027-01-31",
      requiredByDate: "2027-02-02",
      nextIncomeDate: "2027-02-01",
    };
    const offer = { ...OFFERS[2], disbursalWindowDays: 0 };
    const result = assessEmergencyAffordability({ context, offers: [offer] }).offerResults[0];
    expect(result.disbursalDate).toBe("2027-01-31");
    expect(result.finalRepaymentDate).toBe("2027-07-31");
  });

  it("flags a disbursal that misses the required date", () => {
    const result = assessEmergencyAffordability({
      context: { ...CONTEXT, requiredByDate: "2026-08-16" },
      offers: [OFFERS[0]],
    }).offerResults[0];
    expect(result.arrivesByRequiredDate).toBe(false);
    expect(result.reasonCodes).toContain("DISBURSAL_AFTER_REQUIRED_DATE");
  });

  it("uses the supplied Money Constitution ratio and tenure limits", () => {
    const result = assessEmergencyAffordability({
      context: { ...CONTEXT, maximumEmiRatioBasisPoints: 1_000, maximumTenureMonths: 12 },
      offers: [OFFERS[0]],
    }).offerResults[0];
    expect(result.constitutionCompliant).toBe(false);
    expect(result.reasonCodes).toContain("POST_LOAN_EMI_RATIO_EXCEEDED");
    expect(result.reasonCodes).toContain("EMI_DURATION_EXCEEDED");
  });

  it("counts actual negative ledger days in an unaffordable case", () => {
    const profile = fixture.unaffordableScenario.profile;
    const emergency = fixture.unaffordableScenario.emergency;
    const context: EmergencyContext = { ...CONTEXT, ...profile, ...emergency };
    const offer = { ...OFFERS[0], principalPaise: emergency.fundingGapPaise };
    const result = assessEmergencyAffordability({ context, offers: [offer] }).offerResults[0];
    expect(result.negativeBalanceDays).toBeGreaterThan(offer.tenureMonths);
    expect(result.reasonCodes).toContain("NEGATIVE_BALANCE_PROJECTED");
    expect(result.reasonCodes).toContain("PROTECTED_EXPENSE_AT_RISK");
  });

  it("sorts by deadline and safety before total cost", () => {
    const lateCheap = { ...OFFERS[0], id: "late-cheap", disbursalWindowDays: 20 };
    const onTime = { ...OFFERS[1], id: "on-time" };
    const result = compareEmergencyFundingOffers({ context: CONTEXT, offers: [lateCheap, onTime] });
    expect(result.offers[0].offerId).toBe("on-time");
    expect(result.offers[1].reasonCodes).toContain("DISBURSAL_AFTER_REQUIRED_DATE");
  });

  it("is deterministic, stable, integer-paise, and does not mutate input", () => {
    const input = { context: CONTEXT, offers: OFFERS };
    const before = structuredClone(input);
    const first = compareEmergencyFundingOffers(input);
    const second = compareEmergencyFundingOffers(input);
    expect(first).toEqual(second);
    expect(input).toEqual(before);
    for (const offer of first.offers) {
      expect(Number.isSafeInteger(offer.monthlyEmiPaise)).toBe(true);
      expect(Number.isSafeInteger(offer.totalRepaymentPaise)).toBe(true);
      expect(offer.reasonCodes).toEqual([...offer.reasonCodes].sort());
    }
  });

  it("matches the reviewed Aarav golden outputs", () => {
    const result = compareEmergencyFundingOffers({ context: CONTEXT, offers: OFFERS });
    expect(result.offers.map((offer) => offer.offerId)).toEqual(
      fixture.expectedOutputs.safetyFirstOrder,
    );
    for (const offer of result.offers) {
      const expected = fixture.expectedOutputs[
        offer.offerId as keyof Omit<typeof fixture.expectedOutputs, "safetyFirstOrder">
      ];
      expect(offer).toMatchObject(expected);
    }
  });
});
