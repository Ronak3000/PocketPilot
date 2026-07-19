import { addMonthsClamped, compareIsoDates } from "../dates/date-utils";
import { FinanceError } from "../errors";
import { assertNonNegativePaise } from "../money/money";
import type { GoalDateResult, GoalInput } from "../types";

function firstContributionDate(goal: GoalInput): string {
  const sameMonth = addMonthsClamped(goal.startDate, 0, goal.contributionDayOfMonth);
  return compareIsoDates(sameMonth, goal.startDate) >= 0
    ? sameMonth
    : addMonthsClamped(goal.startDate, 1, goal.contributionDayOfMonth);
}

export function calculateGoalDate(goal: GoalInput): GoalDateResult {
  assertNonNegativePaise(goal.targetAmountPaise, "targetAmountPaise");
  assertNonNegativePaise(goal.currentAmountPaise, "currentAmountPaise");
  assertNonNegativePaise(goal.monthlyContributionPaise, "monthlyContributionPaise");
  if (
    !Number.isSafeInteger(goal.contributionDayOfMonth) ||
    goal.contributionDayOfMonth < 1 ||
    goal.contributionDayOfMonth > 31
  ) {
    throw new FinanceError("INVALID_INPUT", "contributionDayOfMonth must be 1 to 31");
  }
  const remainingPaise = Math.max(0, goal.targetAmountPaise - goal.currentAmountPaise);
  if (remainingPaise === 0) {
    return { completed: true, completionDate: goal.startDate, contributionPeriods: 0 };
  }
  if (goal.monthlyContributionPaise === 0) {
    return { completed: false, completionDate: null, contributionPeriods: null };
  }
  const remaining = BigInt(remainingPaise);
  const contribution = BigInt(goal.monthlyContributionPaise);
  const contributionPeriods = Number(
    (remaining + contribution - BigInt(1)) / contribution,
  );
  return {
    completed: false,
    completionDate: addMonthsClamped(
      firstContributionDate(goal),
      contributionPeriods - 1,
      goal.contributionDayOfMonth,
    ),
    contributionPeriods,
  };
}
