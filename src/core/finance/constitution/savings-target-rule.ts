import { FinanceError } from "../errors";
import type {
  ConstitutionRule,
  ConstitutionRuleEvaluation,
  ScenarioResult,
} from "../types";

export function evaluateSavingsTargetRule(
  result: ScenarioResult,
  rule: Extract<ConstitutionRule, { type: "savings_target" }>,
): ConstitutionRuleEvaluation {
  const actualPaise = result.summary.monthlySavingsContributionPaise;
  if (actualPaise === null) {
    throw new FinanceError("MISSING_CONTEXT", "savings target rule requires contribution", {
      missingFields: ["monthlySavingsContributionPaise"],
    });
  }
  const passed = actualPaise >= rule.targetPaise;
  return {
    ruleId: rule.id,
    ruleType: rule.type,
    passed,
    severity: rule.severity,
    warning: passed
      ? undefined
      : {
          code: "SAVINGS_TARGET_MISSED",
          severity: rule.severity,
          ruleId: rule.id,
          threshold: rule.targetPaise,
          actualValue: actualPaise,
          data: { targetPaise: rule.targetPaise, actualPaise },
        },
  };
}
