import { calculateMinimumBalance } from "../cashflow/calculate-minimum-balance";
import { calculateRiskDays } from "../cashflow/calculate-risk-days";
import { buildDailyLedger } from "../cashflow/build-daily-ledger";
import { sortWarnings } from "../constitution/evaluate-rules";
import { dateParts } from "../dates/date-utils";
import { FinanceError } from "../errors";
import { calculateEmiRatio } from "../emi/calculate-emi-ratio";
import { calculateTotalCommitment } from "../emi/calculate-total-commitment";
import { calculateGoalDelay } from "../goals/calculate-goal-delay";
import { assertNonNegativePaise } from "../money/money";
import type {
  FinancialEvent,
  PurchaseProposal,
  ScenarioInput,
  ScenarioResult,
  ScenarioWarning,
} from "../types";

function proposalEvents(
  proposal: PurchaseProposal,
  monthlyEmiPaise: number,
  firstEmiDate: string | null,
  commitmentEndingDate: string | null,
): FinancialEvent[] {
  const events: FinancialEvent[] = [];
  if (proposal.downPaymentPaise > 0) {
    events.push({
      id: `proposal:${proposal.id}:down-payment`,
      title: `${proposal.title} down payment`,
      amountPaise: proposal.downPaymentPaise,
      direction: "outflow",
      kind: "purchase",
      schedule: "once",
      date: proposal.purchaseDate,
    });
  }
  if (proposal.processingFeePaise > 0) {
    events.push({
      id: `proposal:${proposal.id}:processing-fee`,
      title: `${proposal.title} processing fee`,
      amountPaise: proposal.processingFeePaise,
      direction: "outflow",
      kind: "processing_fee",
      schedule: "once",
      date: proposal.purchaseDate,
    });
  }
  if (monthlyEmiPaise > 0 && firstEmiDate && commitmentEndingDate) {
    events.push({
      id: `proposal:${proposal.id}:emi`,
      title: `${proposal.title} EMI`,
      amountPaise: monthlyEmiPaise,
      direction: "outflow",
      kind: "new_emi",
      schedule: "recurring",
      startDate: firstEmiDate,
      endDate: commitmentEndingDate,
      frequency: "monthly",
      dayOfMonth: dateParts(proposal.purchaseDate).day,
    });
  }
  return events;
}

function riskWarnings(
  result: Pick<ScenarioResult, "ledger" | "summary">,
  floorPaise: number,
): ScenarioWarning[] {
  const warnings: ScenarioWarning[] = [];
  const minimumDay = result.ledger.reduce((minimum, day) =>
    day.closingBalancePaise < minimum.closingBalancePaise ? day : minimum,
  );
  if (result.summary.minimumBalancePaise < floorPaise) {
    warnings.push({
      code: "MINIMUM_BALANCE_BREACH",
      severity: "breach",
      threshold: floorPaise,
      actualValue: result.summary.minimumBalancePaise,
      date: minimumDay.date,
      data: { floorPaise, minimumBalancePaise: result.summary.minimumBalancePaise },
    });
  }
  const negativeDays = result.ledger.filter((day) => day.closingBalancePaise < 0);
  if (negativeDays.length) {
    warnings.push({
      code: "NEGATIVE_BALANCE",
      severity: "breach",
      actualValue: result.summary.negativeBalanceDays,
      dateRange: {
        startDate: negativeDays[0].date,
        endDate: negativeDays[negativeDays.length - 1].date,
      },
      data: { negativeBalanceDays: negativeDays.length },
    });
  }
  if (result.summary.protectedExpenseRisk) {
    warnings.push({
      code: "PROTECTED_EXPENSE_AT_RISK",
      severity: "warning",
      data: { protectedExpenseRisk: true },
    });
  }
  return sortWarnings(warnings);
}

export function simulateBaseScenario(
  input: ScenarioInput,
  proposal: PurchaseProposal,
  scenarioType: ScenarioResult["scenarioType"],
): ScenarioResult {
  assertNonNegativePaise(input.monthlyIncomePaise, "monthlyIncomePaise");
  assertNonNegativePaise(input.existingMonthlyEmiPaise, "existingMonthlyEmiPaise");
  assertNonNegativePaise(
    input.protectedBalanceFloorPaise,
    "protectedBalanceFloorPaise",
  );
  if (
    input.incomeConfidence !== undefined &&
    (!Number.isFinite(input.incomeConfidence) ||
      input.incomeConfidence < 0 ||
      input.incomeConfidence > 1)
  ) {
    throw new FinanceError("INVALID_INPUT", "incomeConfidence must be from 0 to 1");
  }
  if (input.goal && input.goalImpactPaise === undefined) {
    throw new FinanceError("MISSING_CONTEXT", "goal scenario requires explicit impact", {
      missingFields: ["goalImpactPaise"],
    });
  }
  const commitment = calculateTotalCommitment(proposal);
  const ledger = buildDailyLedger({
    startDate: input.startDate,
    endDate: input.endDate,
    horizonDays: input.horizonDays,
    startingBalancePaise: input.startingBalancePaise,
    protectedBalanceFloorPaise: input.protectedBalanceFloorPaise,
    lowBalanceThresholdPaise: input.lowBalanceThresholdPaise,
    events: [
      ...input.events,
      ...proposalEvents(
        proposal,
        commitment.monthlyEmiPaise,
        commitment.firstEmiDate,
        commitment.commitmentEndingDate,
      ),
    ],
  });
  const minimum = calculateMinimumBalance(ledger);
  const riskDays = calculateRiskDays(
    ledger,
    input.lowBalanceThresholdPaise ?? input.protectedBalanceFloorPaise,
  );
  const protectedExpenseRisk = ledger.some(
    (day) =>
      day.closingBalancePaise < input.protectedBalanceFloorPaise &&
      day.appliedEvents.some(
        (event) => event.direction === "outflow" && event.protected,
      ),
  );
  const goalDelay = input.goal
    ? calculateGoalDelay({ goal: input.goal, impactPaise: input.goalImpactPaise })
    : null;
  const emiRatio = calculateEmiRatio({
    monthlyIncomePaise: input.monthlyIncomePaise,
    existingMonthlyEmiPaise: input.existingMonthlyEmiPaise,
    newMonthlyEmiPaise: commitment.monthlyEmiPaise,
  });
  const result: ScenarioResult = {
    id: input.id,
    label: input.label,
    scenarioType,
    proposal: { ...proposal },
    ledger,
    commitment,
    summary: {
      minimumBalancePaise: minimum.minimumBalancePaise,
      negativeBalanceDays: riskDays.negativeBalanceDays,
      lowBalanceDays: riskDays.lowBalanceDays,
      goalDelayDays: goalDelay?.goalDelayDays ?? null,
      totalCommitmentPaise: commitment.totalCommittedCostPaise,
      emiRatioBasisPoints: emiRatio.totalEmiBasisPoints,
      protectedExpenseRisk,
      monthlySavingsContributionPaise:
        input.monthlySavingsContributionPaise ?? null,
    },
    warnings: [],
    incomeConfidence: input.incomeConfidence ?? null,
  };
  result.warnings = riskWarnings(result, input.protectedBalanceFloorPaise);
  return result;
}

export function simulateBuyNow(input: ScenarioInput): ScenarioResult {
  return simulateBaseScenario(input, input.proposal, "buy_now");
}
