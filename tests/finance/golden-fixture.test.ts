import { describe, expect, it } from "vitest";
import fixtureJson from "../fixtures/aarav-phone-purchase.json";
import {
  evaluateConstitution,
  simulateScenario,
} from "../../src/core/finance";
import type {
  FinancialEvent,
  GoalInput,
  MoneyConstitution,
  PurchaseProposal,
  ScenarioInput,
  ScenarioType,
} from "../../src/core/finance";

interface GoldenExpected {
  minimumBalancePaise: number;
  negativeBalanceDays: number;
  lowBalanceDays: number;
  goalDelayDays: number | null;
  totalCommitmentPaise: number;
  emiRatioBasisPoints: number;
  constitutionWarnings: string[];
  downPaymentPaise: number;
  processingFeePaise: number;
  monthlyEmiPaise: number;
  installmentCount: number;
  totalInstallmentCommitmentPaise: number;
  firstEmiDate: string | null;
  commitmentEndingDate: string | null;
}

interface GoldenScenario {
  id: string;
  label: string;
  scenarioType: ScenarioType;
  goalImpactPaise: number;
  delayDays?: number;
  alternativeProposal?: PurchaseProposal;
  expected: GoldenExpected | null;
}

const fixture = fixtureJson as unknown as {
  assumptions: { startDate: string; horizonDays: number };
  profile: {
    startingBalancePaise: number;
    monthlyIncomePaise: number;
    existingMonthlyEmiPaise: number;
    protectedBalanceFloorPaise: number;
    monthlySavingsContributionPaise: number;
    incomeConfidence: number;
  };
  events: FinancialEvent[];
  goal: GoalInput;
  constitution: MoneyConstitution;
  proposal: PurchaseProposal;
  scenarios: GoldenScenario[];
};

function scenarioInput(scenario: GoldenScenario): ScenarioInput {
  return {
    ...scenario,
    startDate: fixture.assumptions.startDate,
    horizonDays: fixture.assumptions.horizonDays,
    startingBalancePaise: fixture.profile.startingBalancePaise,
    events: fixture.events,
    proposal: fixture.proposal,
    monthlyIncomePaise: fixture.profile.monthlyIncomePaise,
    existingMonthlyEmiPaise: fixture.profile.existingMonthlyEmiPaise,
    protectedBalanceFloorPaise: fixture.profile.protectedBalanceFloorPaise,
    lowBalanceThresholdPaise: fixture.profile.protectedBalanceFloorPaise,
    monthlySavingsContributionPaise:
      fixture.profile.monthlySavingsContributionPaise,
    incomeConfidence: fixture.profile.incomeConfidence,
    goal: fixture.goal,
    constitution: fixture.constitution,
  };
}

function summary(scenario: GoldenScenario): GoldenExpected {
  const result = simulateScenario(scenarioInput(scenario));
  return {
    minimumBalancePaise: result.summary.minimumBalancePaise,
    negativeBalanceDays: result.summary.negativeBalanceDays,
    lowBalanceDays: result.summary.lowBalanceDays,
    goalDelayDays: result.summary.goalDelayDays,
    totalCommitmentPaise: result.summary.totalCommitmentPaise,
    emiRatioBasisPoints: result.summary.emiRatioBasisPoints,
    constitutionWarnings: evaluateConstitution(result, fixture.constitution).warnings.map(
      (warning) => warning.code,
    ),
    downPaymentPaise: result.commitment.downPaymentPaise,
    processingFeePaise: result.commitment.processingFeePaise,
    monthlyEmiPaise: result.commitment.monthlyEmiPaise,
    installmentCount: result.commitment.installmentCount,
    totalInstallmentCommitmentPaise:
      result.commitment.totalInstallmentCommitmentPaise,
    firstEmiDate: result.commitment.firstEmiDate,
    commitmentEndingDate: result.commitment.commitmentEndingDate,
  };
}

describe("Aarav golden fixture", () => {
  it("has reviewed deterministic outputs for all three scenarios", () => {
    const actual = fixture.scenarios.map((scenario) => ({
      id: scenario.id,
      actual: summary(scenario),
      expected: scenario.expected,
    }));
    expect(actual.every((item) => item.expected !== null)).toBe(true);
    for (const item of actual) expect(item.actual).toEqual(item.expected);
  });
});
