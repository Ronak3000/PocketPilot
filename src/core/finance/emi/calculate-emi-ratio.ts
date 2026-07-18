import { addPaise, assertNonNegativePaise } from "../money/money";
import { ratioBasisPoints } from "../money/percentage";
import type { BasisPoints, Paise } from "../types";

export interface EmiRatioInput {
  monthlyIncomePaise: Paise;
  existingMonthlyEmiPaise: Paise;
  newMonthlyEmiPaise: Paise;
}

export interface EmiRatioResult {
  existingEmiBasisPoints: BasisPoints;
  newEmiBasisPoints: BasisPoints;
  totalEmiBasisPoints: BasisPoints;
}

export function calculateEmiRatio(input: EmiRatioInput): EmiRatioResult {
  assertNonNegativePaise(input.monthlyIncomePaise, "monthlyIncomePaise");
  assertNonNegativePaise(input.existingMonthlyEmiPaise, "existingMonthlyEmiPaise");
  assertNonNegativePaise(input.newMonthlyEmiPaise, "newMonthlyEmiPaise");
  return {
    existingEmiBasisPoints: ratioBasisPoints(
      input.existingMonthlyEmiPaise,
      input.monthlyIncomePaise,
    ),
    newEmiBasisPoints: ratioBasisPoints(
      input.newMonthlyEmiPaise,
      input.monthlyIncomePaise,
    ),
    totalEmiBasisPoints: ratioBasisPoints(
      addPaise(input.existingMonthlyEmiPaise, input.newMonthlyEmiPaise),
      input.monthlyIncomePaise,
    ),
  };
}
