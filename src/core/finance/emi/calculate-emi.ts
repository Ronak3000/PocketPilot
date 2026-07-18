import { FinanceError } from "../errors";
import { assertNonNegativePaise, bigIntRatioHalfUp, dividePaise } from "../money/money";
import {
  annualToMonthlyBasisPoints,
  assertBasisPoints,
} from "../money/percentage";
import type { EmiCalculationInput, EmiCalculationResult } from "../types";

export function calculateEmi(input: EmiCalculationInput): EmiCalculationResult {
  assertNonNegativePaise(input.principalPaise, "principalPaise");
  if (
    !Number.isSafeInteger(input.tenureMonths) ||
    input.tenureMonths <= 0 ||
    input.tenureMonths > 1_200
  ) {
    throw new FinanceError("INVALID_INPUT", "tenureMonths must be from 1 to 1200", {
      tenureMonths: input.tenureMonths,
    });
  }
  if (
    input.annualInterestBasisPoints !== undefined &&
    input.monthlyInterestBasisPoints !== undefined
  ) {
    throw new FinanceError(
      "INVALID_INPUT",
      "provide annual or monthly interest basis points, not both",
    );
  }
  const monthlyInterestBasisPoints =
    input.monthlyInterestBasisPoints ??
    annualToMonthlyBasisPoints(input.annualInterestBasisPoints ?? 0);
  assertBasisPoints(monthlyInterestBasisPoints, "monthlyInterestBasisPoints");

  if (monthlyInterestBasisPoints === 0) {
    return {
      monthlyEmiPaise: dividePaise(input.principalPaise, input.tenureMonths),
      monthlyInterestBasisPoints,
      rounding: "half-up",
    };
  }

  const scale = BigInt(10_000);
  const rate = BigInt(monthlyInterestBasisPoints);
  const periods = BigInt(input.tenureMonths);
  const growth = (scale + rate) ** periods;
  const base = scale ** periods;
  return {
    monthlyEmiPaise: bigIntRatioHalfUp(
      BigInt(input.principalPaise) * rate * growth,
      scale * (growth - base),
      "monthlyEmiPaise",
    ),
    monthlyInterestBasisPoints,
    rounding: "half-up",
  };
}
