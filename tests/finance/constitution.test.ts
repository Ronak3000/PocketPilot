import { describe, expect, it } from "vitest";
import {
  evaluateConstitution,
  sortWarnings,
} from "../../src/core/finance/constitution/evaluate-rules";
import type {
  MoneyConstitution,
  ScenarioResult,
  ScenarioWarning,
} from "../../src/core/finance/types";

const result: ScenarioResult = {
  id: "scenario",
  label: "Scenario",
  scenarioType: "buy_now",
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
  ledger: [
    {
      date: "2026-08-15",
      openingBalancePaise: 2_000_000,
      inflowsPaise: 0,
      outflowsPaise: 1_349_900,
      closingBalancePaise: 650_100,
      appliedEvents: [],
      riskIndicators: ["BELOW_PROTECTED_FLOOR"],
    },
  ],
  summary: {
    minimumBalancePaise: 650_100,
    negativeBalanceDays: 0,
    lowBalanceDays: 1,
    goalDelayDays: 31,
    totalCommitmentPaise: 6_749_900,
    emiRatioBasisPoints: 1_667,
    protectedExpenseRisk: true,
    monthlySavingsContributionPaise: 700_000,
  },
  commitment: {
    principalFinancedPaise: 4_799_900,
    monthlyEmiPaise: 450_000,
    installmentCount: 12,
    totalInstallmentCommitmentPaise: 5_400_000,
    downPaymentPaise: 1_200_000,
    processingFeePaise: 149_900,
    totalCommittedCostPaise: 6_749_900,
    firstEmiDate: "2026-09-15",
    commitmentEndingDate: "2027-08-15",
  },
  warnings: [],
  incomeConfidence: 0.6,
};

const constitution: MoneyConstitution = {
  id: "aarav",
  rules: [
    { id: "floor", type: "minimum_balance", enabled: true, severity: "breach", thresholdPaise: 1_000_000 },
    { id: "ratio", type: "maximum_emi_ratio", enabled: true, severity: "warning", maximumBasisPoints: 1_500 },
    { id: "tenure", type: "maximum_emi_tenure", enabled: true, severity: "warning", maximumMonths: 10 },
    { id: "savings", type: "savings_target", enabled: true, severity: "caution", targetPaise: 800_000 },
    { id: "expense", type: "protected_expense", enabled: true, severity: "breach" },
    { id: "goal", type: "goal_protection", enabled: true, severity: "warning", maximumDelayDays: 0 },
    { id: "guilt", type: "guilt_free_allowance", enabled: true, severity: "caution", maximumPurchasePaise: 4_000_000 },
    { id: "confidence", type: "income_confidence", enabled: true, severity: "warning", minimumConfidence: 0.8 },
  ],
};

describe("Money Constitution", () => {
  it("evaluates every supported rule as structured data", () => {
    const evaluation = evaluateConstitution(result, constitution);
    expect(evaluation.passed).toBe(false);
    expect(evaluation.evaluations).toHaveLength(8);
    expect(evaluation.evaluations.every((item) => !item.passed)).toBe(true);
    expect(evaluation.warnings.map((warning) => warning.code)).toEqual([
      "MINIMUM_BALANCE_BREACH",
      "PROTECTED_EXPENSE_AT_RISK",
      "EMI_DURATION_EXCEEDED",
      "EMI_RATIO_EXCEEDED",
      "GOAL_DELAYED",
      "LOW_CONFIDENCE_INCOME",
      "GUILT_FREE_ALLOWANCE_EXCEEDED",
      "SAVINGS_TARGET_MISSED",
    ]);
  });

  it("sorts equal-severity warnings by date, code, and rule id", () => {
    const warnings: ScenarioWarning[] = [
      { code: "GOAL_DELAYED", severity: "warning", ruleId: "b", date: "2026-02-01", data: {} },
      { code: "EMI_RATIO_EXCEEDED", severity: "warning", ruleId: "a", date: "2026-01-01", data: {} },
    ];
    expect(sortWarnings(warnings).map((warning) => warning.code)).toEqual([
      "EMI_RATIO_EXCEEDED",
      "GOAL_DELAYED",
    ]);
  });

  it("does not replace missing rule context with zero", () => {
    expect(() =>
      evaluateConstitution(
        { ...result, summary: { ...result.summary, monthlySavingsContributionPaise: null } },
        { id: "missing", rules: [constitution.rules[3]] },
      ),
    ).toThrowError(expect.objectContaining({ code: "MISSING_CONTEXT" }));
  });
});
