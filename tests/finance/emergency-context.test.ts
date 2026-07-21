import { describe, expect, it } from "vitest";
import { DEFAULT_PERSONALIZATION, detectEmergencyCategory, selectTone } from "@/core/ai/personalization";
import { checkInsuranceBoundary, validateEmergencyContext } from "@/core/finance/emergency";
import { parseInrToPaise } from "@/features/emergency/money-input";

const COMPLETE_CONTEXT = {
  category: "medical" as const,
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
};

describe("emergency context and intent", () => {
  it("asks for exactly the first missing field without replacing it with zero", () => {
    const result = validateEmergencyContext({ category: "medical", asOfDate: "2026-08-15" });
    expect(result).toMatchObject({ status: "INCOMPLETE", missingField: "totalNeededPaise" });
    expect(result.missingFieldQuestion).toBeTruthy();
  });

  it("accepts explicit zero and complete context", () => {
    const result = validateEmergencyContext({
      ...COMPLETE_CONTEXT,
      alreadyAvailablePaise: 0,
      activeGoalMonthlyContributionPaise: 0,
    });
    expect(result.status).toBe("COMPLETE");
  });

  it("parses rupees to integer paise without floating-point money", () => {
    expect(parseInrToPaise("1,20,000.45")).toBe(12_000_045);
    expect(parseInrToPaise("12.345")).toBeNull();
    expect(parseInrToPaise("-10")).toBeNull();
  });

  it.each([
    ["hospital bill and surgery tomorrow", "medical"],
    ["bhai family emergency hai, paisa chahiye", "family"],
    ["salary delayed hai, no income received", "income_disruption"],
  ])("detects serious intent in English or Hinglish", (text, category) => {
    expect(detectEmergencyCategory(text)).toBe(category);
  });

  it("does not treat normal emergency-fund planning as a live emergency", () => {
    expect(detectEmergencyCategory("Help me plan my emergency fund for next year")).toBeNull();
  });

  it("forces emergency tone regardless of humor preferences", () => {
    expect(selectTone({
      text: "hospital emergency urgent",
      settings: { ...DEFAULT_PERSONALIZATION, humorEnabled: true, roastLevel: 1 },
    })).toBe("EMERGENCY");
  });

  it("never suggests new insurance for an emergency that already happened", () => {
    const result = checkInsuranceBoundary({
      emergencyAlreadyOccurred: true,
      hasExistingInsurance: true,
    });
    expect(result.newInsuranceInapplicable).toBe(true);
    expect(result.applicableAlternatives).toContain("existing_insurance_claim");
    expect(result.applicableAlternatives).toContain("regulated_credit_simulation");
  });
});
