import { describe, expect, it } from "vitest";
import { buildDailyLedger } from "../../src/core/finance/cashflow/build-daily-ledger";
import { calculateMinimumBalance } from "../../src/core/finance/cashflow/calculate-minimum-balance";
import { calculateRiskDays } from "../../src/core/finance/cashflow/calculate-risk-days";
import type { FinancialEvent } from "../../src/core/finance/types";

const events: FinancialEvent[] = [
  {
    id: "rent",
    title: "Rent",
    amountPaise: 1_400_000,
    direction: "outflow",
    kind: "rent",
    protected: true,
    schedule: "recurring",
    startDate: "2026-08-01",
    frequency: "monthly",
    dayOfMonth: 1,
  },
  {
    id: "salary",
    title: "Salary",
    amountPaise: 4_800_000,
    direction: "inflow",
    kind: "salary",
    schedule: "recurring",
    startDate: "2026-08-01",
    frequency: "monthly",
    dayOfMonth: 1,
  },
  {
    id: "purchase",
    title: "Purchase",
    amountPaise: 6_000_000,
    direction: "outflow",
    kind: "purchase",
    schedule: "once",
    date: "2026-08-02",
  },
];

describe("daily cash-flow ledger", () => {
  it("applies same-day inflows before stable-id outflows", () => {
    const ledger = buildDailyLedger({
      startDate: "2026-08-01",
      horizonDays: 3,
      startingBalancePaise: 2_000_000,
      protectedBalanceFloorPaise: 1_000_000,
      events,
    });
    expect(ledger[0]).toMatchObject({
      openingBalancePaise: 2_000_000,
      inflowsPaise: 4_800_000,
      outflowsPaise: 1_400_000,
      closingBalancePaise: 5_400_000,
    });
    expect(ledger[0].appliedEvents.map((event) => event.id)).toEqual(["salary", "rent"]);
    expect(ledger[1].closingBalancePaise).toBe(-600_000);
    expect(ledger[1].riskIndicators).toEqual([
      "BELOW_PROTECTED_FLOOR",
      "NEGATIVE_BALANCE",
    ]);
  });

  it("supports 30, 60, 90, and 730-day horizons deterministically", () => {
    for (const horizonDays of [30, 60, 90, 730]) {
      const input = {
        startDate: "2026-08-01",
        horizonDays,
        startingBalancePaise: 2_000_000,
        events: [],
      };
      expect(buildDailyLedger(input)).toHaveLength(horizonDays);
      expect(buildDailyLedger(input)).toEqual(buildDailyLedger(input));
    }
  });

  it("calculates minimum and risk days", () => {
    const ledger = buildDailyLedger({
      startDate: "2026-08-01",
      horizonDays: 3,
      startingBalancePaise: 2_000_000,
      events,
    });
    expect(calculateMinimumBalance(ledger)).toEqual({
      minimumBalancePaise: -600_000,
      date: "2026-08-02",
    });
    expect(calculateRiskDays(ledger, 1_000_000)).toEqual({
      negativeBalanceDays: 2,
      lowBalanceDays: 2,
    });
  });

  it("rejects duplicate occurrences", () => {
    expect(() =>
      buildDailyLedger({
        startDate: "2026-08-01",
        horizonDays: 1,
        startingBalancePaise: 0,
        events: [events[0], events[0]],
      }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_INPUT" }));
  });
});
