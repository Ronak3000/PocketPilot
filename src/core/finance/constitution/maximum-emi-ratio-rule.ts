import type {
  ConstitutionRule,
  ConstitutionRuleEvaluation,
  ScenarioResult,
} from "../types";

export function evaluateMaximumEmiRatioRule(
  result: ScenarioResult,
  rule: Extract<ConstitutionRule, { type: "maximum_emi_ratio" }>,
): ConstitutionRuleEvaluation {
  const passed = result.summary.emiRatioBasisPoints <= rule.maximumBasisPoints;
  return {
    ruleId: rule.id,
    ruleType: rule.type,
    passed,
    severity: rule.severity,
    warning: passed
      ? undefined
      : {
          code: "EMI_RATIO_EXCEEDED",
          severity: rule.severity,
          ruleId: rule.id,
          threshold: rule.maximumBasisPoints,
          actualValue: result.summary.emiRatioBasisPoints,
          data: {
            maximumBasisPoints: rule.maximumBasisPoints,
            actualBasisPoints: result.summary.emiRatioBasisPoints,
          },
        },
  };
}
