import { FinanceError } from "../errors";
import { assertNonNegativePaise, assertSafeInteger } from "../money/money";
import { assertBasisPoints } from "../money/percentage";
import type {
  ConstitutionEvaluation,
  ConstitutionRule,
  ConstitutionRuleEvaluation,
  MoneyConstitution,
  ScenarioResult,
  ScenarioWarning,
  WarningSeverity,
} from "../types";
import { evaluateGoalProtectionRule } from "./goal-protection-rule";
import { evaluateMaximumDurationRule } from "./maximum-duration-rule";
import { evaluateMaximumEmiRatioRule } from "./maximum-emi-ratio-rule";
import { evaluateMinimumBalanceRule } from "./minimum-balance-rule";
import { evaluateProtectedExpenseRule } from "./protected-expense-rule";
import { evaluateSavingsTargetRule } from "./savings-target-rule";

const severityOrder: Record<WarningSeverity, number> = {
  breach: 0,
  warning: 1,
  caution: 2,
  info: 3,
};

export function sortWarnings(warnings: ScenarioWarning[]): ScenarioWarning[] {
  return [...warnings].sort((left, right) => {
    const severity = severityOrder[left.severity] - severityOrder[right.severity];
    if (severity) return severity;
    const leftDate = left.date ?? left.dateRange?.startDate ?? "\uffff";
    const rightDate = right.date ?? right.dateRange?.startDate ?? "\uffff";
    if (leftDate !== rightDate) return leftDate < rightDate ? -1 : 1;
    if (left.code !== right.code) return left.code < right.code ? -1 : 1;
    const leftRuleId = left.ruleId ?? "";
    const rightRuleId = right.ruleId ?? "";
    return leftRuleId === rightRuleId ? 0 : leftRuleId < rightRuleId ? -1 : 1;
  });
}

function evaluateGuiltFreeAllowance(
  result: ScenarioResult,
  rule: Extract<ConstitutionRule, { type: "guilt_free_allowance" }>,
): ConstitutionRuleEvaluation {
  const passed = result.proposal.listedPricePaise <= rule.maximumPurchasePaise;
  return {
    ruleId: rule.id,
    ruleType: rule.type,
    passed,
    severity: rule.severity,
    warning: passed
      ? undefined
      : {
          code: "GUILT_FREE_ALLOWANCE_EXCEEDED",
          severity: rule.severity,
          ruleId: rule.id,
          threshold: rule.maximumPurchasePaise,
          actualValue: result.proposal.listedPricePaise,
          data: {
            maximumPurchasePaise: rule.maximumPurchasePaise,
            listedPricePaise: result.proposal.listedPricePaise,
          },
        },
  };
}

function evaluateIncomeConfidence(
  result: ScenarioResult,
  rule: Extract<ConstitutionRule, { type: "income_confidence" }>,
): ConstitutionRuleEvaluation {
  if (result.incomeConfidence === null) {
    throw new FinanceError("MISSING_CONTEXT", "income confidence rule requires confidence", {
      missingFields: ["incomeConfidence"],
    });
  }
  const passed = result.incomeConfidence >= rule.minimumConfidence;
  return {
    ruleId: rule.id,
    ruleType: rule.type,
    passed,
    severity: rule.severity,
    warning: passed
      ? undefined
      : {
          code: "LOW_CONFIDENCE_INCOME",
          severity: rule.severity,
          ruleId: rule.id,
          threshold: rule.minimumConfidence,
          actualValue: result.incomeConfidence,
          data: {
            minimumConfidence: rule.minimumConfidence,
            actualConfidence: result.incomeConfidence,
          },
        },
  };
}

function evaluateRule(
  result: ScenarioResult,
  rule: ConstitutionRule,
): ConstitutionRuleEvaluation {
  switch (rule.type) {
    case "minimum_balance":
      return evaluateMinimumBalanceRule(result, rule);
    case "maximum_emi_ratio":
      return evaluateMaximumEmiRatioRule(result, rule);
    case "maximum_emi_tenure":
      return evaluateMaximumDurationRule(result, rule);
    case "savings_target":
      return evaluateSavingsTargetRule(result, rule);
    case "protected_expense":
      return evaluateProtectedExpenseRule(result, rule);
    case "goal_protection":
      return evaluateGoalProtectionRule(result, rule);
    case "guilt_free_allowance":
      return evaluateGuiltFreeAllowance(result, rule);
    case "income_confidence":
      return evaluateIncomeConfidence(result, rule);
    default:
      throw new FinanceError("INVALID_INPUT", "unsupported Constitution rule type");
  }
}

function validateRule(rule: ConstitutionRule): void {
  if (!rule.id) throw new FinanceError("INVALID_INPUT", "Constitution rule id is required");
  switch (rule.type) {
    case "minimum_balance":
      assertNonNegativePaise(rule.thresholdPaise, "thresholdPaise");
      break;
    case "maximum_emi_ratio":
      assertBasisPoints(rule.maximumBasisPoints, "maximumBasisPoints");
      break;
    case "maximum_emi_tenure":
      assertSafeInteger(rule.maximumMonths, "maximumMonths");
      if (rule.maximumMonths < 0) {
        throw new FinanceError("INVALID_INPUT", "maximumMonths must be non-negative");
      }
      break;
    case "savings_target":
      assertNonNegativePaise(rule.targetPaise, "targetPaise");
      break;
    case "goal_protection":
      assertSafeInteger(rule.maximumDelayDays, "maximumDelayDays");
      if (rule.maximumDelayDays < 0) {
        throw new FinanceError("INVALID_INPUT", "maximumDelayDays must be non-negative");
      }
      break;
    case "guilt_free_allowance":
      assertNonNegativePaise(rule.maximumPurchasePaise, "maximumPurchasePaise");
      break;
    case "income_confidence":
      if (
        !Number.isFinite(rule.minimumConfidence) ||
        rule.minimumConfidence < 0 ||
        rule.minimumConfidence > 1
      ) {
        throw new FinanceError("INVALID_INPUT", "minimumConfidence must be from 0 to 1");
      }
      break;
    case "protected_expense":
      break;
    default:
      throw new FinanceError("INVALID_INPUT", "unsupported Constitution rule type");
  }
}

export function evaluateConstitution(
  result: ScenarioResult,
  constitution: MoneyConstitution,
): ConstitutionEvaluation {
  const enabledRules = constitution.rules.filter((rule) => rule.enabled);
  enabledRules.forEach(validateRule);
  const evaluations = enabledRules
    .map((rule) => evaluateRule(result, rule));
  const warnings = sortWarnings(
    evaluations.flatMap((evaluation) =>
      evaluation.warning ? [evaluation.warning] : [],
    ),
  );
  return {
    passed: evaluations.every((evaluation) => evaluation.passed),
    evaluations,
    warnings,
  };
}
