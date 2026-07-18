import { describe, expect, it } from "vitest";
import { calculateGoalDate } from "../../src/core/finance/goals/calculate-goal-date";
import { calculateGoalDelay } from "../../src/core/finance/goals/calculate-goal-delay";
import { calculateRequiredContribution } from "../../src/core/finance/goals/calculate-required-contribution";
import type { GoalInput } from "../../src/core/finance/types";

const goal: GoalInput = {
  id: "emergency",
  targetAmountPaise: 15_000_000,
  currentAmountPaise: 7_200_000,
  monthlyContributionPaise: 800_000,
  contributionDayOfMonth: 5,
  startDate: "2026-08-15",
};

describe("goal engine", () => {
  it("uses the explicit contribution day", () => {
    expect(calculateGoalDate(goal)).toEqual({
      completed: false,
      completionDate: "2027-06-05",
      contributionPeriods: 10,
    });
  });

  it("handles completed and impossible goals", () => {
    expect(calculateGoalDate({ ...goal, currentAmountPaise: 15_000_000 })).toEqual({
      completed: true,
      completionDate: "2026-08-15",
      contributionPeriods: 0,
    });
    expect(calculateGoalDate({ ...goal, monthlyContributionPaise: 0 })).toEqual({
      completed: false,
      completionDate: null,
      contributionPeriods: null,
    });
  });

  it("calculates delay, missed periods, and catch-up contribution", () => {
    expect(
      calculateGoalDelay({
        goal,
        impactPaise: 1_749_900,
        missedContributionPeriods: 1,
      }),
    ).toEqual({
      originalCompletionDate: "2027-06-05",
      newCompletionDate: "2027-09-05",
      goalDelayDays: 92,
      missedContributionPeriods: 1,
      requiredCatchUpContributionPaise: 254_990,
      goalProtectionBreached: true,
    });
  });

  it("rounds required catch-up contributions upward", () => {
    expect(
      calculateRequiredContribution({
        remainingAmountPaise: 100,
        contributionPeriods: 3,
      }),
    ).toBe(34);
  });
});
