import type {
  ConstitutionRule,
  ConstitutionRuleEvaluation,
  ScenarioResult,
} from "../types";

export function evaluateMaximumDurationRule(
  result: ScenarioResult,
  rule: Extract<ConstitutionRule, { type: "maximum_emi_tenure" }>,
): ConstitutionRuleEvaluation {
  const actualMonths = result.proposal.tenureMonths ?? 0;
  const passed = actualMonths <= rule.maximumMonths;
  return {
    ruleId: rule.id,
    ruleType: rule.type,
    passed,
    severity: rule.severity,
    warning: passed
      ? undefined
      : {
          code: "EMI_DURATION_EXCEEDED",
          severity: rule.severity,
          ruleId: rule.id,
          threshold: rule.maximumMonths,
          actualValue: actualMonths,
          data: { maximumMonths: rule.maximumMonths, actualMonths },
        },
  };
}
