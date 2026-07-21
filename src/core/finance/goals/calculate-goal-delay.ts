import { daysBetween } from "../dates/date-utils";
import { FinanceError } from "../errors";
import { addPaise, assertNonNegativePaise, multiplyPaise } from "../money/money";
import type { GoalDelayInput, GoalDelayResult } from "../types";
import { calculateGoalDate } from "./calculate-goal-date";
import { calculateRequiredContribution } from "./calculate-required-contribution";

export function calculateGoalDelay(input: GoalDelayInput): GoalDelayResult {
  const impactPaise = input.impactPaise ?? 0;
  const missedContributionPeriods = input.missedContributionPeriods ?? 0;
  assertNonNegativePaise(impactPaise, "impactPaise");
  if (
    !Number.isSafeInteger(missedContributionPeriods) ||
    missedContributionPeriods < 0
  ) {
    throw new FinanceError("INVALID_INPUT", "missedContributionPeriods must be non-negative");
  }
  const original = calculateGoalDate(input.goal);
  const missedAmountPaise = multiplyPaise(
    input.goal.monthlyContributionPaise,
    missedContributionPeriods,
  );
  const totalImpactPaise = addPaise(impactPaise, missedAmountPaise);
  const delayed = calculateGoalDate({
    ...input.goal,
    targetAmountPaise: addPaise(input.goal.targetAmountPaise, totalImpactPaise),
  });
  const goalDelayDays =
    original.completionDate && delayed.completionDate
      ? daysBetween(original.completionDate, delayed.completionDate)
      : null;
  const requiredCatchUpContributionPaise =
    totalImpactPaise > 0 && (original.contributionPeriods ?? 0) > 0
      ? calculateRequiredContribution({
          remainingAmountPaise: totalImpactPaise,
          contributionPeriods: original.contributionPeriods!,
        })
      : 0;
  return {
    originalCompletionDate: original.completionDate,
    newCompletionDate: delayed.completionDate,
    goalDelayDays,
    missedContributionPeriods,
    requiredCatchUpContributionPaise,
    goalProtectionBreached: goalDelayDays === null ? totalImpactPaise > 0 : goalDelayDays > 0,
  };
}
