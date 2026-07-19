import { describe, expect, it } from "vitest";
import { calculateFlexibleIncome } from "../../src/core/finance/safe-to-spend/calculate-flexible-income";
import { calculateSafeToSpend } from "../../src/core/finance/safe-to-spend/calculate-safe-to-spend";
import type { FinancialEvent } from "../../src/core/finance/types";

const events: FinancialEvent[] = [
  {
    id: "salary",
    title: "Salary",
    amountPaise: 4_800_000,
    direction: "inflow",
    kind: "salary",
    schedule: "recurring",
    startDate: "2026-09-01",
    frequency: "monthly",
    dayOfMonth: 1,
  },
  {
    id: "rent",
    title: "Rent",
    amountPaise: 1_400_000,
    direction: "outflow",
    kind: "rent",
    schedule: "once",
    date: "2026-08-20",
  },
  {
    id: "optional",
    title: "Optional",
    amountPaise: 500_000,
    direction: "outflow",
    kind: "other",
    schedule: "once",
    date: "2026-08-21",
  },
];

describe("safe to spend", () => {
  it("protects only explicitly selected commitments before next income", () => {
    expect(
      calculateSafeToSpend({
        startDate: "2026-08-15",
        currentBalancePaise: 7_200_000,
        protectedBalanceFloorPaise: 1_000_000,
        events,
        protectedEventIds: ["rent"],
      }),
    ).toEqual({
      safeToSpendPaise: 4_800_000,
      protectedCommitmentsPaise: 1_400_000,
      protectedBalanceFloorPaise: 1_000_000,
      amountAvailableUntilNextIncomePaise: 5_800_000,
      bufferRemainingPaise: 4_800_000,
      nextIncomeDate: "2026-09-01",
      warnings: [],
    });
  });

  it("clamps spendable and flexible values at zero while exposing the buffer", () => {
    const result = calculateSafeToSpend({
      startDate: "2026-08-15",
      currentBalancePaise: 1_000_000,
      protectedBalanceFloorPaise: 1_000_000,
      events,
      protectedEventIds: ["rent"],
    });
    expect(result.safeToSpendPaise).toBe(0);
    expect(result.bufferRemainingPaise).toBe(-1_400_000);
    expect(
      calculateFlexibleIncome({
        monthlyIncomePaise: 1_000_000,
        protectedMonthlyOutflowsPaise: 1_400_000,
      }),
    ).toBe(0);
  });

  it("returns structured missing context instead of inventing income timing", () => {
    expect(() =>
      calculateSafeToSpend({
        startDate: "2026-08-15",
        currentBalancePaise: 7_200_000,
        protectedBalanceFloorPaise: 1_000_000,
        events: events.filter((event) => event.direction === "outflow"),
        protectedEventIds: ["rent"],
      }),
    ).toThrowError(expect.objectContaining({ code: "MISSING_CONTEXT" }));
  });
});
