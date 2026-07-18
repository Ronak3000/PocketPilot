import { FinanceError } from "../errors";
import type { Paise } from "../types";

export type RoundingMode = "half-up" | "floor" | "ceil";

export function assertSafeInteger(value: number, field = "value"): number {
  if (!Number.isSafeInteger(value)) {
    throw new FinanceError("UNSAFE_INTEGER", `${field} must be a safe integer`, { field, value });
  }
  return value;
}

export function assertNonNegativePaise(value: Paise, field = "amountPaise"): Paise {
  assertSafeInteger(value, field);
  if (value < 0) {
    throw new FinanceError("INVALID_INPUT", `${field} must be non-negative`, { field, value });
  }
  return value;
}

function fromBigInt(value: bigint, field: string): number {
  const result = Number(value);
  if (!Number.isSafeInteger(result)) {
    throw new FinanceError("OVERFLOW", `${field} exceeds the safe integer range`, {
      field,
      value: value.toString(),
    });
  }
  return result;
}

export function addPaise(...amounts: Paise[]): Paise {
  amounts.forEach((amount, index) => assertSafeInteger(amount, `amounts[${index}]`));
  return fromBigInt(amounts.reduce((sum, amount) => sum + BigInt(amount), BigInt(0)), "sum");
}

export function subtractPaise(minuend: Paise, subtrahend: Paise): Paise {
  assertSafeInteger(minuend, "minuend");
  assertSafeInteger(subtrahend, "subtrahend");
  return fromBigInt(BigInt(minuend) - BigInt(subtrahend), "difference");
}

export function multiplyPaise(amountPaise: Paise, multiplier: number): Paise {
  assertSafeInteger(amountPaise, "amountPaise");
  assertSafeInteger(multiplier, "multiplier");
  return fromBigInt(BigInt(amountPaise) * BigInt(multiplier), "product");
}

export function dividePaise(
  amountPaise: Paise,
  divisor: number,
  rounding: RoundingMode = "half-up",
): Paise {
  assertSafeInteger(amountPaise, "amountPaise");
  assertSafeInteger(divisor, "divisor");
  if (divisor <= 0) {
    throw new FinanceError("INVALID_INPUT", "divisor must be positive", { divisor });
  }
  const numerator = BigInt(amountPaise);
  const denominator = BigInt(divisor);
  const quotient = numerator / denominator;
  const remainder = numerator % denominator;
  if (rounding === "floor" || remainder === BigInt(0)) return fromBigInt(quotient, "quotient");
  if (rounding === "ceil") return fromBigInt(quotient + BigInt(1), "quotient");
  return fromBigInt(
    quotient + (remainder * BigInt(2) >= denominator ? BigInt(1) : BigInt(0)),
    "quotient",
  );
}

export function comparePaise(left: Paise, right: Paise): -1 | 0 | 1 {
  assertSafeInteger(left, "left");
  assertSafeInteger(right, "right");
  return left === right ? 0 : left < right ? -1 : 1;
}

export function formatPaise(amountPaise: Paise): string {
  assertSafeInteger(amountPaise, "amountPaise");
  const sign = amountPaise < 0 ? "-" : "";
  const absolute = Math.abs(amountPaise);
  return `${sign}₹${Math.floor(absolute / 100).toLocaleString("en-IN")}.${String(absolute % 100).padStart(2, "0")}`;
}

export function bigIntRatioHalfUp(numerator: bigint, denominator: bigint, field: string): number {
  if (denominator <= BigInt(0)) {
    throw new FinanceError("INVALID_INPUT", `${field} denominator must be positive`);
  }
  const quotient = numerator / denominator;
  const remainder = numerator % denominator;
  return fromBigInt(
    quotient + (remainder * BigInt(2) >= denominator ? BigInt(1) : BigInt(0)),
    field,
  );
}
