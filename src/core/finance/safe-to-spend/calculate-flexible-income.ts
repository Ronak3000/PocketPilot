import { assertNonNegativePaise } from "../money/money";
import type { FlexibleIncomeInput, Paise } from "../types";

export function calculateFlexibleIncome(input: FlexibleIncomeInput): Paise {
  assertNonNegativePaise(input.monthlyIncomePaise, "monthlyIncomePaise");
  assertNonNegativePaise(
    input.protectedMonthlyOutflowsPaise,
    "protectedMonthlyOutflowsPaise",
  );
  return Math.max(0, input.monthlyIncomePaise - input.protectedMonthlyOutflowsPaise);
}
