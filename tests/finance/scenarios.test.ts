import { describe, expect, it } from "vitest";
import {
  compareScenarios,
  simulateScenario,
} from "../../src/core/finance";
import type { FinancialEvent, ScenarioInput } from "../../src/core/finance";

const recurringEvents: FinancialEvent[] = [
  {
    id: "salary",
    title: "Salary",
    amountPaise: 4_800_000,
    direction: "inflow",
    kind: "salary",
    schedule: "recurring",
    startDate: "2026-09-01",
    frequency: "monthly",
    dayOfMonth: 1,
  },
  ...[
    ["rent", "Rent", 1_400_000, "rent", 3],
    ["family", "Family transfer", 500_000, "family_transfer", 5],
    ["existing-emi", "Existing EMI", 350_000, "existing_emi", 10],
    ["savings", "Savings", 800_000, "goal_contribution", 5],
  ].map(
    ([id, title, amountPaise, kind, dayOfMonth]) =>
      ({
        id,
        title,
        amountPaise,
        direction: "outflow",
        kind,
        protected: true,
        schedule: "recurring",
        startDate: `2026-09-${String(dayOfMonth).padStart(2, "0")}`,
        frequency: "monthly",
        dayOfMonth,
      }) as FinancialEvent,
  ),
];

const base: ScenarioInput = {
  id: "buy",
  label: "Buy now",
  scenarioType: "buy_now",
  startDate: "2026-08-15",
  horizonDays: 730,
  startingBalancePaise: 7_200_000,
  events: recurringEvents,
  proposal: {
    id: "phone",
    title: "Phone",
    listedPricePaise: 5_999_900,
    purchaseDate: "2026-08-15",
    downPaymentPaise: 1_200_000,
    processingFeePaise: 149_900,
    monthlyEmiPaise: 450_000,
    tenureMonths: 12,
  },
  monthlyIncomePaise: 4_800_000,
  existingMonthlyEmiPaise: 350_000,
  protectedBalanceFloorPaise: 1_000_000,
  lowBalanceThresholdPaise: 1_000_000,
  monthlySavingsContributionPaise: 800_000,
  incomeConfidence: 1,
  goal: {
    id: "emergency",
    targetAmountPaise: 15_000_000,
    currentAmountPaise: 7_200_000,
    monthlyContributionPaise: 800_000,
    contributionDayOfMonth: 5,
    startDate: "2026-08-15",
  },
  goalImpactPaise: 6_749_900,
};

describe("scenario simulation", () => {
  it("simulates buy now without mutating input", () => {
    const before = structuredClone(base);
    const result = simulateScenario(base);
    expect(base).toEqual(before);
    expect(result).toMatchObject({
      scenarioType: "buy_now",
      summary: {
        minimumBalancePaise: 5_850_100,
        negativeBalanceDays: 0,
        lowBalanceDays: 0,
        totalCommitmentPaise: 6_749_900,
        emiRatioBasisPoints: 1_667,
      },
    });
    expect(result.ledger).toHaveLength(730);
  });

  it("shifts only the proposal for a delayed purchase", () => {
    const result = simulateScenario({
      ...base,
      id: "wait",
      label: "Wait 45 days",
      scenarioType: "delay",
      delayDays: 45,
    });
    expect(result.proposal.purchaseDate).toBe("2026-09-29");
    expect(
      result.ledger
        .flatMap((day) => day.appliedEvents.map((event) => [day.date, event.id]))
        .filter(([, id]) => id.startsWith("proposal:"))[0][0],
    ).toBe("2026-09-29");
  });

  it("requires explicit alternative terms", () => {
    expect(() =>
      simulateScenario({ ...base, scenarioType: "alternative" }),
    ).toThrowError(expect.objectContaining({ code: "MISSING_CONTEXT" }));
    const result = simulateScenario({
      ...base,
      id: "alternative",
      scenarioType: "alternative",
      alternativeProposal: {
        id: "cheaper-phone",
        title: "Cheaper phone",
        listedPricePaise: 3_999_900,
        purchaseDate: "2026-08-15",
        downPaymentPaise: 3_999_900,
        processingFeePaise: 0,
      },
      goalImpactPaise: 3_999_900,
    });
    expect(result.summary.totalCommitmentPaise).toBe(3_999_900);
    expect(result.summary.emiRatioBasisPoints).toBe(729);
  });

  it("shifts only explicitly selected income", () => {
    const result = simulateScenario({
      ...base,
      id: "income-delay",
      scenarioType: "income_delay",
      incomeDelay: { eventIds: ["salary"], delayDays: 7 },
    });
    const septemberInflows = result.ledger
      .filter((day) => day.inflowsPaise > 0)
      .map((day) => day.date);
    expect(septemberInflows[0]).toBe("2026-09-08");
    expect(result.warnings.map((warning) => warning.code)).toContain(
      "INCOME_DEPENDENCY",
    );
    expect(result.ledger.find((day) => day.date === "2026-09-03")?.outflowsPaise).toBe(
      1_400_000,
    );
  });

  it("returns stable, sortable comparison data without declaring a winner", () => {
    const comparison = compareScenarios([
      base,
      { ...base, id: "wait", label: "Wait", scenarioType: "delay", delayDays: 45 },
    ]);
    expect(comparison.scenarios.map((scenario) => scenario.scenarioId)).toEqual([
      "buy",
      "wait",
    ]);
    expect(comparison.scenarios[0]).toHaveProperty("constitutionConflictCount", 0);
  });

  it("is deeply deterministic across repeated runs", () => {
    const expected = simulateScenario(base);
    for (let index = 0; index < 5; index += 1) {
      expect(simulateScenario(base)).toEqual(expected);
    }
  });
});
