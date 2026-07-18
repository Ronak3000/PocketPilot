import { assertNonNegativePaise, dividePaise } from "../money/money";
import type { Paise } from "../types";
import { FinanceError } from "../errors";

export function calculateRequiredContribution(input: {
  remainingAmountPaise: Paise;
  contributionPeriods: number;
}): Paise {
  assertNonNegativePaise(input.remainingAmountPaise, "remainingAmountPaise");
  if (!Number.isSafeInteger(input.contributionPeriods) || input.contributionPeriods <= 0) {
    throw new FinanceError("INVALID_INPUT", "contributionPeriods must be positive");
  }
  return dividePaise(input.remainingAmountPaise, input.contributionPeriods, "ceil");
}
