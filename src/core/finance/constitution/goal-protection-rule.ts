import { FinanceError } from "../errors";
import type {
  ConstitutionRule,
  ConstitutionRuleEvaluation,
  ScenarioResult,
} from "../types";

export function evaluateGoalProtectionRule(
  result: ScenarioResult,
  rule: Extract<ConstitutionRule, { type: "goal_protection" }>,
): ConstitutionRuleEvaluation {
  const delayDays = result.summary.goalDelayDays;
  if (delayDays === null) {
    throw new FinanceError("MISSING_CONTEXT", "goal rule requires goal-delay context", {
      missingFields: ["goalDelayDays"],
    });
  }
  const passed = delayDays <= rule.maximumDelayDays;
  return {
    ruleId: rule.id,
    ruleType: rule.type,
    passed,
    severity: rule.severity,
    warning: passed
      ? undefined
      : {
          code: "GOAL_DELAYED",
          severity: rule.severity,
          ruleId: rule.id,
          threshold: rule.maximumDelayDays,
          actualValue: delayDays,
          data: { maximumDelayDays: rule.maximumDelayDays, goalDelayDays: delayDays },
        },
  };
}
