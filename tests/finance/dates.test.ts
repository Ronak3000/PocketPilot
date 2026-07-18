import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonthsClamped,
  daysBetween,
  resolveEndDate,
  toEpochDay,
} from "../../src/core/finance/dates/date-utils";
import { generateRecurringDates } from "../../src/core/finance/dates/recurrence";
import type { FinancialEvent } from "../../src/core/finance/types";

describe("timezone-safe ISO dates", () => {
  it("handles leap years and rejects invalid dates", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2028-02-29", 1)).toBe("2028-03-01");
    expect(() => toEpochDay("2027-02-29")).toThrowError(
      expect.objectContaining({ code: "INVALID_DATE" }),
    );
  });

  it("clamps month-end dates deterministically", () => {
    expect(addMonthsClamped("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonthsClamped("2028-01-31", 1)).toBe("2028-02-29");
    expect(addMonthsClamped("2026-02-10", 1, 31)).toBe("2026-03-31");
  });

  it("treats ledger start and end dates as inclusive", () => {
    expect(resolveEndDate({ startDate: "2026-01-01", horizonDays: 30 })).toBe(
      "2026-01-30",
    );
    expect(daysBetween("2026-01-01", "2026-01-30")).toBe(29);
    expect(() =>
      resolveEndDate({ startDate: "2026-02-01", endDate: "2026-01-31" }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_DATE_RANGE" }));
  });

  it("produces the same dates in different machine timezones", () => {
    const originalTimezone = process.env.TZ;
    try {
      const results = ["UTC", "Asia/Kolkata", "America/Los_Angeles"].map(
        (timezone) => {
          process.env.TZ = timezone;
          return addMonthsClamped(addDays("2028-02-28", 1), 1, 31);
        },
      );
      expect(results).toEqual(["2028-03-31", "2028-03-31", "2028-03-31"]);
    } finally {
      process.env.TZ = originalTimezone;
    }
  });
});

describe("recurrence scheduling", () => {
  it("clamps day 31 and prevents duplicates", () => {
    const salary: FinancialEvent = {
      id: "salary",
      title: "Salary",
      amountPaise: 4_800_000,
      direction: "inflow",
      kind: "salary",
      schedule: "recurring",
      startDate: "2026-01-31",
      frequency: "monthly",
      dayOfMonth: 31,
    };
    expect(generateRecurringDates(salary, "2026-01-01", "2026-04-30")).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
      "2026-04-30",
    ]);
  });

  it("supports bounded weekly recurrence", () => {
    const bill: FinancialEvent = {
      id: "weekly",
      title: "Weekly",
      amountPaise: 100,
      direction: "outflow",
      kind: "bill",
      schedule: "recurring",
      startDate: "2026-01-01",
      endDate: "2026-01-20",
      frequency: "weekly",
    };
    expect(generateRecurringDates(bill, "2026-01-05", "2026-01-31")).toEqual([
      "2026-01-08",
      "2026-01-15",
    ]);
  });
});
