import { describe, expect, it } from "vitest";
import { FinanceError } from "../../src/core/finance/errors";
import {
  addPaise,
  dividePaise,
  formatPaise,
  multiplyPaise,
  subtractPaise,
} from "../../src/core/finance/money/money";
import {
  annualToMonthlyBasisPoints,
  applyBasisPoints,
  ratioBasisPoints,
} from "../../src/core/finance/money/percentage";

describe("integer-paise money primitives", () => {
  it("calculates without floating-point currency", () => {
    expect(addPaise(5_999_900, 149_900)).toBe(6_149_800);
    expect(subtractPaise(5_999_900, 1_200_000)).toBe(4_799_900);
    expect(multiplyPaise(450_000, 12)).toBe(5_400_000);
    expect(formatPaise(5_999_900)).toBe("₹59,999.00");
  });

  it("uses explicit half-up, floor, and ceil division", () => {
    expect(dividePaise(101, 2)).toBe(51);
    expect(dividePaise(101, 2, "floor")).toBe(50);
    expect(dividePaise(101, 2, "ceil")).toBe(51);
  });

  it("rejects unsafe values and overflow", () => {
    expect(() => addPaise(Number.MAX_SAFE_INTEGER, 1)).toThrowError(FinanceError);
    expect(() => multiplyPaise(Number.MAX_SAFE_INTEGER, 2)).toThrowError(
      expect.objectContaining({ code: "OVERFLOW" }),
    );
  });
});

describe("basis-point calculations", () => {
  it("rounds ratios and percentages half-up", () => {
    expect(ratioBasisPoints(8_000, 48_000)).toBe(1_667);
    expect(applyBasisPoints(1_000_00, 1_250)).toBe(12_500);
    expect(annualToMonthlyBasisPoints(1_200)).toBe(100);
  });

  it("rejects a zero ratio denominator", () => {
    expect(() => ratioBasisPoints(1, 0)).toThrowError(
      expect.objectContaining({ code: "MISSING_CONTEXT" }),
    );
  });
});
