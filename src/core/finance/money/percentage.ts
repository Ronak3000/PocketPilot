import { FinanceError } from "../errors";
import type { BasisPoints, Paise } from "../types";
import {
  assertNonNegativePaise,
  assertSafeInteger,
  bigIntRatioHalfUp,
} from "./money";

export function assertBasisPoints(value: BasisPoints, field = "basisPoints"): BasisPoints {
  assertSafeInteger(value, field);
  if (value < 0) {
    throw new FinanceError("INVALID_INPUT", `${field} must be non-negative`, { field, value });
  }
  return value;
}

export function ratioBasisPoints(numerator: Paise, denominator: Paise): BasisPoints {
  assertNonNegativePaise(numerator, "numerator");
  assertNonNegativePaise(denominator, "denominator");
  if (denominator === 0) {
    throw new FinanceError("MISSING_CONTEXT", "ratio denominator must be greater than zero", {
      missingFields: ["denominator"],
    });
  }
  return bigIntRatioHalfUp(
    BigInt(numerator) * BigInt(10_000),
    BigInt(denominator),
    "ratio",
  );
}

export function applyBasisPoints(amountPaise: Paise, basisPoints: BasisPoints): Paise {
  assertNonNegativePaise(amountPaise);
  assertBasisPoints(basisPoints);
  return bigIntRatioHalfUp(
    BigInt(amountPaise) * BigInt(basisPoints),
    BigInt(10_000),
    "percentage",
  );
}

export function annualToMonthlyBasisPoints(annualBasisPoints: BasisPoints): BasisPoints {
  assertBasisPoints(annualBasisPoints, "annualInterestBasisPoints");
  return bigIntRatioHalfUp(
    BigInt(annualBasisPoints),
    BigInt(12),
    "monthlyInterestBasisPoints",
  );
}
