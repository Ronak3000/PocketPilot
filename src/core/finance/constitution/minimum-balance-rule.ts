import type {
  ConstitutionRuleEvaluation,
  ScenarioResult,
} from "../types";

export function evaluateMinimumBalanceRule(
  result: ScenarioResult,
  rule: Extract<
    import("../types").ConstitutionRule,
    { type: "minimum_balance" }
  >,
): ConstitutionRuleEvaluation {
  const minimumDay = result.ledger.reduce((minimum, day) =>
    day.closingBalancePaise < minimum.closingBalancePaise ? day : minimum,
  );
  const passed = result.summary.minimumBalancePaise >= rule.thresholdPaise;
  return {
    ruleId: rule.id,
    ruleType: rule.type,
    passed,
    severity: rule.severity,
    warning: passed
      ? undefined
      : {
          code: "MINIMUM_BALANCE_BREACH",
          severity: rule.severity,
          ruleId: rule.id,
          threshold: rule.thresholdPaise,
          actualValue: result.summary.minimumBalancePaise,
          date: minimumDay.date,
          data: {
            thresholdPaise: rule.thresholdPaise,
            minimumBalancePaise: result.summary.minimumBalancePaise,
          },
        },
  };
}
