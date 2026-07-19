/**
 * Bridge: converts frontend types into finance engine types and back.
 * This is the integration layer between Task 1 (UI) and Task 2 (Engine).
 */

import type {
  FinancialProfile,
  MoneyConstitution as FrontendConstitution,
  ExtractedDecision,
  ScenarioComparison as FrontendScenarioComparison,
  FutureReceipt,
  ActionPlan,
  SafeToSpend as FrontendSafeToSpend,
  ConstitutionEvaluation as FrontendConstitutionEvaluation,
  ScenarioResult as FrontendScenarioResult,
  DailyLedgerEntry as FrontendLedgerEntry,
  ProjectedBalance,
  ReceiptStatus,
} from "@/features/types";

import {
  simulateScenario,
  compareScenarios,
  evaluateConstitution,
  calculateSafeToSpend,
} from "@/core/finance";

import type {
  ScenarioInput,
  FinancialEvent,
  PurchaseProposal,
  MoneyConstitution as EngineConstitution,
  ScenarioResult as EngineScenarioResult,
  SafeToSpendInput,
  ConstitutionEvaluation as EngineConstitutionEvaluation,
  DailyLedgerEntry as EngineLedgerEntry,
  IsoDate,
} from "@/core/finance";

// ───── Profile → Engine Events ─────

function profileToEvents(profile: FinancialProfile): FinancialEvent[] {
  const events: FinancialEvent[] = [];
  const today = new Date().toISOString().split("T")[0];

  // Salary
  events.push({
    id: "evt-salary",
    title: "Monthly Salary",
    amountPaise: profile.monthlySalaryPaise,
    direction: "inflow",
    kind: "salary",
    schedule: "recurring",
    startDate: today,
    frequency: "monthly",
    dayOfMonth: profile.salaryDay,
  });

  // Rent
  if (profile.rentPaise > 0) {
    events.push({
      id: "evt-rent",
      title: "Rent",
      amountPaise: profile.rentPaise,
      direction: "outflow",
      kind: "rent",
      protected: true,
      schedule: "recurring",
      startDate: today,
      frequency: "monthly",
      dayOfMonth: 1,
    });
  }

  // Family transfer
  if (profile.familyTransferPaise > 0) {
    events.push({
      id: "evt-family",
      title: "Family Transfer",
      amountPaise: profile.familyTransferPaise,
      direction: "outflow",
      kind: "family_transfer",
      protected: true,
      schedule: "recurring",
      startDate: today,
      frequency: "monthly",
      dayOfMonth: 5,
    });
  }

  // Existing EMI
  if (profile.existingEmiPaise > 0) {
    events.push({
      id: "evt-existing-emi",
      title: "Existing EMI",
      amountPaise: profile.existingEmiPaise,
      direction: "outflow",
      kind: "existing_emi",
      schedule: "recurring",
      startDate: today,
      frequency: "monthly",
      dayOfMonth: 5,
    });
  }

  // Savings contribution
  if (profile.monthlySavingsTargetPaise > 0) {
    events.push({
      id: "evt-savings",
      title: "Monthly Savings",
      amountPaise: profile.monthlySavingsTargetPaise,
      direction: "outflow",
      kind: "goal_contribution",
      schedule: "recurring",
      startDate: today,
      frequency: "monthly",
      dayOfMonth: 1,
    });
  }

  return events;
}

// ───── Frontend Constitution → Engine Constitution ─────

function toEngineConstitution(fc: FrontendConstitution): EngineConstitution {
  return {
    id: fc.id,
    rules: fc.rules
      .filter((r) => r.enabled)
      .map((r) => {
        const base = { id: r.id, enabled: true, severity: "warning" as const };
        switch (r.reasonCode) {
          case "MINIMUM_BALANCE_BREACH":
            return { ...base, type: "minimum_balance" as const, thresholdPaise: r.thresholdValue };
          case "EMI_RATIO_EXCEEDED":
            return { ...base, type: "maximum_emi_ratio" as const, maximumBasisPoints: r.thresholdValue * 100 };
          case "EMI_DURATION_EXCEEDED":
            return { ...base, type: "maximum_emi_tenure" as const, maximumMonths: r.thresholdValue };
          case "SAVINGS_TARGET_MISSED":
            return { ...base, type: "savings_target" as const, targetPaise: r.thresholdValue };
          case "PROTECTED_EXPENSE_AT_RISK":
            return { ...base, type: "protected_expense" as const };
          default:
            return { ...base, type: "minimum_balance" as const, thresholdPaise: r.thresholdValue };
        }
      }),
  };
}

// ───── Decision → Proposal ─────

function decisionToProposal(decision: ExtractedDecision): PurchaseProposal {
  const today = new Date().toISOString().split("T")[0];
  return {
    id: `proposal-${decision.id}`,
    title: decision.productName,
    listedPricePaise: decision.pricePaise,
    purchaseDate: today,
    downPaymentPaise: decision.downPaymentPaise ?? 0,
    processingFeePaise: decision.processingFeePaise ?? 0,
    monthlyEmiPaise: decision.emiAmountPaise,
    tenureMonths: decision.tenureMonths,
  };
}

// ───── Engine Result → Frontend Result ─────

function engineLedgerToFrontend(entries: EngineLedgerEntry[]): FrontendLedgerEntry[] {
  return entries.slice(0, 90).map((e) => ({
    date: e.date,
    label: e.appliedEvents.map((ae) => ae.title).join(", ") || "—",
    amountPaise: e.inflowsPaise - e.outflowsPaise,
    balancePaise: e.closingBalancePaise,
    isIncome: e.inflowsPaise > 0,
    isCommitment: e.appliedEvents.some((ae) => ae.protected),
    breachesFloor: e.riskIndicators.includes("BELOW_PROTECTED_FLOOR"),
  }));
}

function ledgerToProjectedBalances(entries: EngineLedgerEntry[]): ProjectedBalance[] {
  // Sample every 7 days for the sparkline
  return entries
    .filter((_, i) => i % 7 === 0 || i === entries.length - 1)
    .map((e) => ({ date: e.date, balancePaise: e.closingBalancePaise }));
}

function determineStatus(
  engineResult: EngineScenarioResult,
  evaluation: EngineConstitutionEvaluation | null,
): ReceiptStatus {
  if (engineResult.summary.negativeBalanceDays > 0) return "BREACH";
  if (evaluation && !evaluation.passed) {
    const hasBreach = evaluation.warnings.some((w) => w.severity === "breach");
    if (hasBreach) return "BREACH";
    return "WARNING";
  }
  if (engineResult.warnings.length > 0) return "CAUTION";
  return "SAFE";
}

function engineEvalToFrontend(
  evaluation: EngineConstitutionEvaluation | null,
  fc: FrontendConstitution,
): FrontendConstitutionEvaluation[] {
  if (!evaluation) return [];
  return evaluation.evaluations.map((ev) => {
    const rule = fc.rules.find((r) => r.id === ev.ruleId);
    return {
      ruleId: ev.ruleId,
      ruleName: rule?.name ?? ev.ruleType,
      reasonCode: rule?.reasonCode ?? ev.ruleType,
      severity: ev.severity === "breach" ? "breach" : ev.severity === "caution" ? "warning" : "info",
      message: ev.warning
        ? `${rule?.name ?? ev.ruleType}: threshold breached`
        : `${rule?.name ?? ev.ruleType}: OK`,
      currentValue: ev.warning?.actualValue ?? 0,
      thresholdValue: ev.warning?.threshold ?? rule?.thresholdValue ?? 0,
    };
  });
}

function engineResultToFrontend(
  engineResult: EngineScenarioResult,
  evaluation: EngineConstitutionEvaluation | null,
  fc: FrontendConstitution,
  scenarioLabel: string,
): FrontendScenarioResult {
  const status = determineStatus(engineResult, evaluation);
  const conflicts = engineEvalToFrontend(evaluation, fc);
  const emiPercent = engineResult.summary.emiRatioBasisPoints / 100;

  let recommendation = "";
  if (status === "SAFE") recommendation = "This purchase is safe. Your finances can handle it.";
  else if (status === "CAUTION") recommendation = "Proceed with caution. Some financial rules are tight.";
  else if (status === "WARNING") recommendation = "This purchase has risks. Consider alternatives.";
  else recommendation = "Not recommended. This purchase will breach your financial rules.";

  return {
    id: engineResult.id,
    scenarioInputId: engineResult.id,
    scenarioType: engineResult.scenarioType === "alternative" ? "cheaper_alternative" : engineResult.scenarioType === "delay" ? "wait" : "buy_now",
    label: scenarioLabel,
    status,
    lowestBalancePaise: engineResult.summary.minimumBalancePaise,
    lowestBalanceDate: engineResult.ledger.reduce((min, d) =>
      d.closingBalancePaise < min.closingBalancePaise ? d : min,
    ).date,
    lowBalanceDays: engineResult.summary.lowBalanceDays,
    negativeBalanceDays: engineResult.summary.negativeBalanceDays,
    goalDelayDays: engineResult.summary.goalDelayDays ?? 0,
    totalCommittedPaise: engineResult.summary.totalCommitmentPaise,
    emiToIncomeRatio: emiPercent,
    constitutionConflicts: conflicts.filter((c) => c.severity !== "info"),
    recommendation,
    dailyLedger: engineLedgerToFrontend(engineResult.ledger),
    projectedBalances: ledgerToProjectedBalances(engineResult.ledger),
  };
}

// ───── Public API: Run Full Analysis ─────

export interface AnalysisResult {
  decision: ExtractedDecision;
  comparison: FrontendScenarioComparison;
  receipt: FutureReceipt;
  plan: ActionPlan;
  safeToSpend: FrontendSafeToSpend;
}

export function runFullAnalysis(
  profile: FinancialProfile,
  constitution: FrontendConstitution,
  decision: ExtractedDecision,
): AnalysisResult {
  const events = profileToEvents(profile);
  const engineConstitution = toEngineConstitution(constitution);
  const proposal = decisionToProposal(decision);
  const today = new Date().toISOString().split("T")[0];

  // ── Build scenario inputs ──

  const baseBuyNow: ScenarioInput = {
    id: "scenario-buy-now",
    label: "Buy Now",
    scenarioType: "buy_now",
    startDate: today,
    horizonDays: 180,
    startingBalancePaise: profile.currentBalancePaise,
    events,
    proposal,
    monthlyIncomePaise: profile.monthlySalaryPaise,
    existingMonthlyEmiPaise: profile.existingEmiPaise,
    protectedBalanceFloorPaise: profile.protectedBalanceFloorPaise,
    monthlySavingsContributionPaise: profile.monthlySavingsTargetPaise,
    constitution: engineConstitution,
    goal: {
      id: "goal-emergency-fund",
      targetAmountPaise: profile.emergencyFundGoalPaise,
      currentAmountPaise: profile.emergencyFundCurrentPaise,
      monthlyContributionPaise: profile.monthlySavingsTargetPaise,
      contributionDayOfMonth: 1,
      startDate: today,
    },
    goalImpactPaise: proposal.downPaymentPaise + proposal.processingFeePaise,
  };

  const wait45: ScenarioInput = {
    ...baseBuyNow,
    id: "scenario-wait-45",
    label: "Wait 45 Days",
    scenarioType: "delay",
    delayDays: 45,
  };

  const cheaperPhone: PurchaseProposal = {
    id: "proposal-cheaper",
    title: "Budget Alternative Phone",
    listedPricePaise: 3_999_900,
    purchaseDate: today,
    downPaymentPaise: 800_000,
    processingFeePaise: 99_900,
    monthlyEmiPaise: 300_000,
    tenureMonths: 12,
  };

  const alternative: ScenarioInput = {
    ...baseBuyNow,
    id: "scenario-cheaper",
    label: "₹39,999 Alternative",
    scenarioType: "alternative",
    alternativeProposal: cheaperPhone,
  };

  // ── Run simulations ──

  const buyNowResult = simulateScenario(baseBuyNow);
  const waitResult = simulateScenario(wait45);
  const altResult = simulateScenario(alternative);

  // ── Evaluate constitution ──

  const buyNowEval = evaluateConstitution(buyNowResult, engineConstitution);
  const waitEval = evaluateConstitution(waitResult, engineConstitution);
  const altEval = evaluateConstitution(altResult, engineConstitution);

  // ── Convert to frontend types ──

  const frontendBuyNow = engineResultToFrontend(buyNowResult, buyNowEval, constitution, "Buy Now");
  const frontendWait = engineResultToFrontend(waitResult, waitEval, constitution, "Wait 45 Days");
  const frontendAlt = engineResultToFrontend(altResult, altEval, constitution, "₹39,999 Alternative");

  const scenarios = [frontendBuyNow, frontendWait, frontendAlt];

  // Pick recommendation: fewest conflicts, then best status
  const statusRank: Record<ReceiptStatus, number> = { SAFE: 0, CAUTION: 1, WARNING: 2, BREACH: 3 };
  const sorted = [...scenarios].sort((a, b) => {
    const conflictDiff = a.constitutionConflicts.length - b.constitutionConflicts.length;
    if (conflictDiff !== 0) return conflictDiff;
    return statusRank[a.status] - statusRank[b.status];
  });
  const recommendedId = sorted[0].id;

  const comparison: FrontendScenarioComparison = {
    id: `comparison-${Date.now()}`,
    scenarios,
    recommendedScenarioId: recommendedId,
    comparisonSummary: `Compared ${scenarios.length} scenarios. "${sorted[0].label}" has the fewest conflicts.`,
  };

  // ── Build Future Receipt for buy-now ──

  const receipt: FutureReceipt = {
    id: `receipt-${Date.now()}`,
    scenarioResultId: frontendBuyNow.id,
    status: frontendBuyNow.status,
    productName: decision.productName,
    listedPricePaise: decision.pricePaise,
    upfrontPaymentPaise: (decision.downPaymentPaise ?? 0) + (decision.processingFeePaise ?? 0),
    emiAmountPaise: decision.emiAmountPaise ?? 0,
    tenureMonths: decision.tenureMonths ?? 0,
    processingFeePaise: decision.processingFeePaise ?? 0,
    totalCommittedPaise: frontendBuyNow.totalCommittedPaise,
    commitmentEndDate: buyNowResult.commitment.commitmentEndingDate ?? today,
    lowestProjectedBalancePaise: frontendBuyNow.lowestBalancePaise,
    lowestBalanceDate: frontendBuyNow.lowestBalanceDate,
    lowBalanceDays: frontendBuyNow.lowBalanceDays,
    negativeBalanceDays: frontendBuyNow.negativeBalanceDays,
    goalDelayDays: frontendBuyNow.goalDelayDays,
    emiBurdenPercent: frontendBuyNow.emiToIncomeRatio,
    constitutionConflicts: frontendBuyNow.constitutionConflicts,
    assumptions: [
      "Salary credited on day 1 each month",
      "No unplanned expenses during projection",
      "Existing EMI continues unchanged",
      "Savings contribution maintained",
    ],
    confidence: decision.confidence,
    recommendation: frontendBuyNow.recommendation,
    dailyLedger: frontendBuyNow.dailyLedger,
    projectedBalances: frontendBuyNow.projectedBalances,
    createdAt: new Date().toISOString(),
  };

  // ── Build Safe Plan ──

  const plan: ActionPlan = {
    id: `plan-${Date.now()}`,
    receiptId: receipt.id,
    recommendedDate: sorted[0].label.includes("Wait")
      ? new Date(Date.now() + 45 * 86400000).toISOString().split("T")[0]
      : today,
    maxPricePaise: decision.pricePaise,
    requiredDownPaymentPaise: decision.downPaymentPaise ?? 0,
    maxEmiPaise: decision.emiAmountPaise ?? 0,
    maxTenureMonths: decision.tenureMonths ?? 0,
    requiredBalanceBeforePurchasePaise: profile.protectedBalanceFloorPaise + (decision.downPaymentPaise ?? 0) + (decision.processingFeePaise ?? 0),
    invalidationConditions: [
      "Salary is delayed by more than 7 days",
      "An unplanned expense exceeds ₹5,000",
      "Balance drops below ₹10,000 before purchase",
    ],
    status: "draft",
    createdAt: new Date().toISOString(),
  };

  // ── Calculate Safe to Spend ──

  let safeToSpend: FrontendSafeToSpend;
  try {
    const stsResult = calculateSafeToSpend({
      startDate: today,
      currentBalancePaise: profile.currentBalancePaise,
      protectedBalanceFloorPaise: profile.protectedBalanceFloorPaise,
      events,
      protectedEventIds: events.filter((e) => e.protected).map((e) => e.id),
    });

    const bufferRatio = stsResult.safeToSpendPaise / profile.monthlySalaryPaise;
    let bufferQuality: FrontendSafeToSpend["bufferQuality"] = "excellent";
    if (bufferRatio < 0.1) bufferQuality = "critical";
    else if (bufferRatio < 0.2) bufferQuality = "tight";
    else if (bufferRatio < 0.4) bufferQuality = "good";

    safeToSpend = {
      safeAmountPaise: stsResult.safeToSpendPaise,
      protectedAmountPaise: stsResult.protectedCommitmentsPaise,
      upcomingCommitmentPaise: stsResult.protectedCommitmentsPaise,
      bufferQuality,
      confidence: 0.95,
      lastCalculatedAt: new Date().toISOString(),
    };
  } catch {
    safeToSpend = {
      safeAmountPaise: Math.max(0, profile.currentBalancePaise - profile.protectedBalanceFloorPaise - profile.rentPaise - profile.familyTransferPaise),
      protectedAmountPaise: profile.rentPaise + profile.familyTransferPaise,
      upcomingCommitmentPaise: profile.rentPaise + profile.familyTransferPaise + profile.existingEmiPaise,
      bufferQuality: "good",
      confidence: 0.85,
      lastCalculatedAt: new Date().toISOString(),
    };
  }

  return { decision, comparison, receipt, plan, safeToSpend };
}
