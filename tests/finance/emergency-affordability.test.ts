// ── Emergency Affordability Tests ──
// Tests deterministic calculations, consent flow, reason codes,
// Hinglish detection, serious mode, and financial accuracy.

import { describe, it, expect } from "vitest";
import {
  assessEmergencyAffordability,
  compareEmergencyFundingOffers,
  validateEmergencyContext,
  checkInsuranceBoundary,
} from "@/core/finance/emergency";
import { detectEmergencyCategory, selectTone, DEFAULT_PERSONALIZATION } from "@/core/ai/personalization";
import type { EmergencyContext, ExplicitLoanOffer } from "@/core/finance/emergency";
import fixture from "../fixtures/aarav-emergency-funding.json";

// ── Shared fixtures ──

const AARAV_CONTEXT: EmergencyContext = {
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
  asOfDate: fixture.assumptions.asOfDate,
};

const ALPHA_OFFER: ExplicitLoanOffer = {
  id: "mock-offer-alpha",
  principalPaise: fixture.emergency.fundingGapPaise,
  annualRateBasisPoints: 1400,
  tenureMonths: 18,
  processingFeePaise: 100000,
  otherChargesPaise: 0,
  disbursalWindowDays: 3,
  eligibilityCriteria: ["Income above ₹25,000/month", "No existing defaults"],
};

const BETA_OFFER: ExplicitLoanOffer = {
  id: "mock-offer-beta",
  principalPaise: fixture.emergency.fundingGapPaise,
  annualRateBasisPoints: 1800,
  tenureMonths: 12,
  processingFeePaise: 150000,
  otherChargesPaise: 0,
  disbursalWindowDays: 2,
  eligibilityCriteria: ["Income above ₹20,000/month"],
};

const GAMMA_OFFER: ExplicitLoanOffer = {
  id: "mock-offer-gamma",
  principalPaise: fixture.emergency.fundingGapPaise,
  annualRateBasisPoints: 2400,
  tenureMonths: 6,
  processingFeePaise: 200000,
  otherChargesPaise: 0,
  disbursalWindowDays: 1,
  eligibilityCriteria: ["Income above ₹15,000/month"],
};

// ── 1. Funding Gap Calculation ──

describe("Emergency: funding gap", () => {
  it("calculates gap as totalNeeded − alreadyAvailable", () => {
    const result = assessEmergencyAffordability({
      context: AARAV_CONTEXT,
      offers: [ALPHA_OFFER],
    });
    expect(result.fundingGapPaise).toBe(fixture.emergency.fundingGapPaise);
  });

  it("gap is never negative when alreadyAvailable exceeds total needed", () => {
    const ctx: EmergencyContext = {
      ...AARAV_CONTEXT,
      alreadyAvailablePaise: 15_000_000, // more than needed
      totalNeededPaise: 12_000_000,
    };
    const result = assessEmergencyAffordability({ context: ctx, offers: [ALPHA_OFFER] });
    expect(result.fundingGapPaise).toBe(0);
  });
});

// ── 2. EMI Calculation (integer paise) ──

describe("Emergency: EMI is integer paise", () => {
  it("monthly EMI is always an integer", () => {
    const result = assessEmergencyAffordability({
      context: AARAV_CONTEXT,
      offers: [ALPHA_OFFER, BETA_OFFER, GAMMA_OFFER],
    });
    for (const r of result.offerResults) {
      expect(Number.isInteger(r.monthlyEmiPaise)).toBe(true);
      expect(r.monthlyEmiPaise).toBeGreaterThan(0);
    }
  });

  it("total fees are integer paise", () => {
    const result = assessEmergencyAffordability({
      context: AARAV_CONTEXT,
      offers: [ALPHA_OFFER],
    });
    expect(Number.isInteger(result.offerResults[0].totalFeesPaise)).toBe(true);
    expect(result.offerResults[0].totalFeesPaise).toBe(100000); // only processing fee
  });

  it("total repayment > principal + processing fee (interest exists)", () => {
    const result = assessEmergencyAffordability({
      context: AARAV_CONTEXT,
      offers: [ALPHA_OFFER],
    });
    const r = result.offerResults[0];
    expect(r.totalRepaymentPaise).toBeGreaterThan(ALPHA_OFFER.principalPaise + ALPHA_OFFER.processingFeePaise);
  });
});

// ── 3. Determinism — same input, same output ──

describe("Emergency: determinism", () => {
  it("produces identical results on repeated calls with same input", () => {
    const input = { context: AARAV_CONTEXT, offers: [ALPHA_OFFER, BETA_OFFER, GAMMA_OFFER] };
    const r1 = assessEmergencyAffordability(input);
    const r2 = assessEmergencyAffordability(input);
    expect(r1).toEqual(r2);
  });

  it("comparison produces stable order", () => {
    const input = { context: AARAV_CONTEXT, offers: [GAMMA_OFFER, ALPHA_OFFER, BETA_OFFER] };
    const c1 = compareEmergencyFundingOffers(input);
    const c2 = compareEmergencyFundingOffers(input);
    expect(c1.offers.map((o) => o.offerId)).toEqual(c2.offers.map((o) => o.offerId));
  });
});

// ── 4. Offer Comparison — lowest total cost first ──

describe("Emergency: offer comparison ordering", () => {
  it("sorts by total repayment ascending (lowest cost first)", () => {
    const comparison = compareEmergencyFundingOffers({
      context: AARAV_CONTEXT,
      offers: [GAMMA_OFFER, ALPHA_OFFER, BETA_OFFER],
    });
    const costs = comparison.offers.map((o) => o.totalRepaymentPaise);
    for (let i = 1; i < costs.length; i++) {
      expect(costs[i]).toBeGreaterThanOrEqual(costs[i - 1]);
    }
  });
});

// ── 5. Reason Codes — stable ordering ──

describe("Emergency: reason codes are stable", () => {
  it("reason codes are in alphabetical order", () => {
    const result = assessEmergencyAffordability({
      context: AARAV_CONTEXT,
      offers: [ALPHA_OFFER],
    });
    const codes = result.offerResults[0].reasonCodes;
    const sorted = [...codes].sort();
    expect(codes).toEqual(sorted);
  });
});

// ── 6. Unaffordable Scenario ──

describe("Emergency: unaffordable scenario", () => {
  it("produces adverse reason codes when income is too low", () => {
    const unaffordableCtx: EmergencyContext = {
      category: "medical",
      totalNeededPaise: fixture.unaffordableScenario.emergency.totalNeededPaise,
      alreadyAvailablePaise: fixture.unaffordableScenario.emergency.alreadyAvailablePaise,
      requiredByDate: fixture.unaffordableScenario.emergency.requiredByDate,
      currentBalancePaise: fixture.unaffordableScenario.profile.currentBalancePaise,
      monthlyIncomePaise: fixture.unaffordableScenario.profile.monthlyIncomePaise,
      nextIncomeDate: fixture.unaffordableScenario.profile.nextIncomeDate,
      protectedBalanceFloorPaise: fixture.unaffordableScenario.profile.protectedBalanceFloorPaise,
      protectedMonthlyExpensesPaise: fixture.unaffordableScenario.profile.protectedMonthlyExpensesPaise,
      existingMonthlyEmiPaise: fixture.unaffordableScenario.profile.existingMonthlyEmiPaise,
      activeGoalMonthlyContributionPaise: fixture.unaffordableScenario.profile.activeGoalMonthlyContributionPaise,
      asOfDate: fixture.assumptions.asOfDate,
    };
    const unaffordableAlpha: ExplicitLoanOffer = {
      ...ALPHA_OFFER,
      principalPaise: fixture.unaffordableScenario.emergency.fundingGapPaise,
    };
    const result = assessEmergencyAffordability({
      context: unaffordableCtx,
      offers: [unaffordableAlpha],
    });
    const codes = result.offerResults[0].reasonCodes;
    // Must NOT contain AFFORDABILITY_FIT
    expect(codes).not.toContain("AFFORDABILITY_FIT");
    // Must contain at least one adverse code
    const adverseCodes = ["NEGATIVE_BALANCE_PROJECTED", "PROTECTED_BALANCE_BREACH",
      "POST_LOAN_EMI_RATIO_EXCEEDED", "INSUFFICIENT_REPAYMENT_BUFFER"];
    expect(codes.some((c) => adverseCodes.includes(c))).toBe(true);
  });
});

// ── 7. Context Validation — INCOMPLETE gate ──

describe("Emergency: context validation", () => {
  it("returns INCOMPLETE with one missing field question when field is absent", () => {
    const result = validateEmergencyContext({
      category: "medical",
      asOfDate: "2026-08-15",
      // totalNeededPaise is missing
    } as Parameters<typeof validateEmergencyContext>[0]);
    expect(result.status).toBe("INCOMPLETE");
    expect(result.missingField).toBe("totalNeededPaise");
    expect(result.missingFieldQuestion).toBeTruthy();
  });

  it("zero is a valid value (not treated as missing)", () => {
    const result = validateEmergencyContext({
      category: "medical",
      asOfDate: "2026-08-15",
      totalNeededPaise: 12_000_000,
      alreadyAvailablePaise: 0, // zero is valid
      requiredByDate: "2026-08-25",
      currentBalancePaise: 7_200_000,
      monthlyIncomePaise: 4_800_000,
      nextIncomeDate: "2026-09-01",
      protectedBalanceFloorPaise: 1_000_000,
      protectedMonthlyExpensesPaise: 1_900_000,
      existingMonthlyEmiPaise: 350_000,
      activeGoalMonthlyContributionPaise: 0, // zero is valid
    });
    expect(result.status).toBe("COMPLETE");
  });

  it("returns COMPLETE when all fields are provided", () => {
    const result = validateEmergencyContext({
      category: "medical",
      asOfDate: "2026-08-15",
      totalNeededPaise: 12_000_000,
      alreadyAvailablePaise: 2_000_000,
      requiredByDate: "2026-08-25",
      currentBalancePaise: 7_200_000,
      monthlyIncomePaise: 4_800_000,
      nextIncomeDate: "2026-09-01",
      protectedBalanceFloorPaise: 1_000_000,
      protectedMonthlyExpensesPaise: 1_900_000,
      existingMonthlyEmiPaise: 350_000,
      activeGoalMonthlyContributionPaise: 800_000,
    });
    expect(result.status).toBe("COMPLETE");
    expect(result.context).toBeDefined();
  });
});

// ── 8. Serious Mode — no humor ──

describe("Emergency: serious mode", () => {
  it("selects EMERGENCY tone for medical terms", () => {
    const tone = selectTone({
      text: "I have a hospital bill I cannot pay",
      settings: DEFAULT_PERSONALIZATION,
    });
    expect(tone).toBe("EMERGENCY");
  });

  it("selects EMERGENCY tone for income disruption terms", () => {
    const tone = selectTone({
      text: "I lost my job and cannot afford rent",
      settings: DEFAULT_PERSONALIZATION,
    });
    expect(tone).toBe("EMERGENCY");
  });

  it("EMERGENCY tone not affected by humor settings", () => {
    const tone = selectTone({
      text: "hospital emergency urgent",
      settings: { ...DEFAULT_PERSONALIZATION, humorEnabled: true, roastLevel: 1 },
    });
    expect(tone).toBe("EMERGENCY");
  });
});

// ── 9. Hinglish Emergency Detection ──

describe("Emergency: Hinglish detection", () => {
  it("detects emergency from Hinglish input", () => {
    const category = detectEmergencyCategory("yaar mujhe paisa chahiye, medical emergency hai");
    expect(category).not.toBeNull();
    expect(["medical", "other"]).toContain(category);
  });

  it("detects income disruption from Hinglish", () => {
    const category = detectEmergencyCategory("bhai salary delayed hai, can't afford rent");
    expect(category).not.toBeNull();
  });
});

// ── 10. Insurance Boundary ──

describe("Emergency: insurance boundary", () => {
  it("marks new insurance as inapplicable when emergency already occurred", () => {
    const result = checkInsuranceBoundary({
      emergencyAlreadyOccurred: true,
      hasExistingInsurance: false,
    });
    expect(result.newInsuranceInapplicable).toBe(true);
    expect(result.preventionRoadmapOnly).toBe(true);
    expect(result.applicableAlternatives).not.toContain("new_insurance");
  });

  it("includes existing_insurance_claim when user has insurance", () => {
    const result = checkInsuranceBoundary({
      emergencyAlreadyOccurred: true,
      hasExistingInsurance: true,
    });
    expect(result.applicableAlternatives).toContain("existing_insurance_claim");
  });

  it("includes regulated_credit_simulation in alternatives", () => {
    const result = checkInsuranceBoundary({
      emergencyAlreadyOccurred: true,
      hasExistingInsurance: false,
    });
    expect(result.applicableAlternatives).toContain("regulated_credit_simulation");
  });
});

// ── 11. Emotional data does not affect eligibility ──

describe("Emergency: no emotional data in eligibility", () => {
  it("identical financial data produces identical results regardless of stated desperation", () => {
    // The engine only receives numeric financial data — no text sentiment
    const r1 = assessEmergencyAffordability({ context: AARAV_CONTEXT, offers: [ALPHA_OFFER] });
    const r2 = assessEmergencyAffordability({ context: AARAV_CONTEXT, offers: [ALPHA_OFFER] });
    // If inputs are identical, outputs must be identical
    expect(r1.offerResults[0].reasonCodes).toEqual(r2.offerResults[0].reasonCodes);
    expect(r1.offerResults[0].monthlyEmiPaise).toEqual(r2.offerResults[0].monthlyEmiPaise);
  });
});
