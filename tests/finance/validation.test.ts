import { describe, expect, it } from "vitest";
import { evaluateConstitution } from "../../src/core/finance/constitution/evaluate-rules";
import { calculateEmi } from "../../src/core/finance/emi/calculate-emi";
import { calculateSafeToSpend } from "../../src/core/finance/safe-to-spend/calculate-safe-to-spend";
import { simulateScenario } from "../../src/core/finance";
import type { ScenarioInput, ScenarioResult } from "../../src/core/finance/types";

const proposal = {
  id: "phone",
  title: "Phone",
  listedPricePaise: 100_000,
  purchaseDate: "2026-08-15",
  downPaymentPaise: 100_000,
  processingFeePaise: 0,
};

const scenario: ScenarioInput = {
  id: "validation",
  label: "Validation",
  scenarioType: "buy_now",
  startDate: "2026-08-15",
  horizonDays: 30,
  startingBalancePaise: 1_000_000,
  events: [],
  proposal,
  monthlyIncomePaise: 1_000_000,
  existingMonthlyEmiPaise: 0,
  protectedBalanceFloorPaise: 0,
  lowBalanceThresholdPaise: 0,
  monthlySavingsContributionPaise: 0,
  incomeConfidence: 1,
  goalImpactPaise: 0,
};

describe("finance input validation", () => {
  it("rejects impractical EMI tenure before exponentiation", () => {
    expect(() =>
      calculateEmi({
        principalPaise: 100_000,
        tenureMonths: 1_201,
        annualInterestBasisPoints: 1_200,
      }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_INPUT" }));
  });

  it("rejects protected event ids that do not exist", () => {
    expect(() =>
      calculateSafeToSpend({
        startDate: "2026-08-15",
        currentBalancePaise: 1_000_000,
        protectedBalanceFloorPaise: 0,
        events: [
          {
            id: "salary",
            title: "Salary",
            amountPaise: 1_000_000,
            direction: "inflow",
            kind: "salary",
            schedule: "once",
            date: "2026-08-20",
          },
        ],
        protectedEventIds: ["unknown"],
      }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_INPUT" }));
  });

  it("rejects invalid confidence instead of treating it as unknown", () => {
    expect(() =>
      simulateScenario({ ...scenario, incomeConfidence: Number.NaN }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_INPUT" }));
  });

  it("rejects invalid Constitution thresholds", () => {
    const result = simulateScenario(scenario) as ScenarioResult;
    expect(() =>
      evaluateConstitution(result, {
        id: "invalid",
        rules: [
          {
            id: "floor",
            type: "minimum_balance",
            enabled: true,
            severity: "breach",
            thresholdPaise: -1,
          },
        ],
      }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_INPUT" }));
  });

  it("does not permit income-delay stress on an outflow", () => {
    expect(() =>
      simulateScenario({
        ...scenario,
        scenarioType: "income_delay",
        events: [
          {
            id: "rent",
            title: "Rent",
            amountPaise: 100_000,
            direction: "outflow",
            kind: "rent",
            schedule: "once",
            date: "2026-08-20",
          },
        ],
        incomeDelay: { eventIds: ["rent"], delayDays: 2 },
      }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_INPUT" }));
  });
});
