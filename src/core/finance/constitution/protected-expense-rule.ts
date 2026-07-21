import type {
  ConstitutionRule,
  ConstitutionRuleEvaluation,
  ScenarioResult,
} from "../types";

export function evaluateProtectedExpenseRule(
  result: ScenarioResult,
  rule: Extract<ConstitutionRule, { type: "protected_expense" }>,
): ConstitutionRuleEvaluation {
  const passed = !result.summary.protectedExpenseRisk;
  return {
    ruleId: rule.id,
    ruleType: rule.type,
    passed,
    severity: rule.severity,
    warning: passed
      ? undefined
      : {
          code: "PROTECTED_EXPENSE_AT_RISK",
          severity: rule.severity,
          ruleId: rule.id,
          data: { protectedExpenseRisk: true },
        },
  };
}
