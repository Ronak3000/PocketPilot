import { FinanceError } from "../errors";
import type { IsoDate } from "../types";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

export function toEpochDay(date: IsoDate): number {
  const match = ISO_DATE.exec(date);
  if (!match) throw new FinanceError("INVALID_DATE", "date must use YYYY-MM-DD", { date });
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new FinanceError("INVALID_DATE", "date is not a real calendar date", { date });
  }
  return Math.floor(timestamp / DAY_MS);
}

export function fromEpochDay(epochDay: number): IsoDate {
  if (!Number.isSafeInteger(epochDay)) {
    throw new FinanceError("INVALID_DATE", "epoch day must be a safe integer", { epochDay });
  }
  return new Date(epochDay * DAY_MS).toISOString().slice(0, 10);
}

export function compareIsoDates(left: IsoDate, right: IsoDate): -1 | 0 | 1 {
  const difference = toEpochDay(left) - toEpochDay(right);
  return difference === 0 ? 0 : difference < 0 ? -1 : 1;
}

export function addDays(date: IsoDate, days: number): IsoDate {
  if (!Number.isSafeInteger(days)) {
    throw new FinanceError("INVALID_INPUT", "days must be a safe integer", { days });
  }
  return fromEpochDay(toEpochDay(date) + days);
}

export function daysBetween(startDate: IsoDate, endDate: IsoDate): number {
  return toEpochDay(endDate) - toEpochDay(startDate);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function dateParts(date: IsoDate): { year: number; month: number; day: number } {
  toEpochDay(date);
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

export function addMonthsClamped(
  date: IsoDate,
  months: number,
  preferredDay?: number,
): IsoDate {
  if (!Number.isSafeInteger(months)) {
    throw new FinanceError("INVALID_INPUT", "months must be a safe integer", { months });
  }
  const parts = dateParts(date);
  const rawMonth = parts.month - 1 + months;
  const year = parts.year + Math.floor(rawMonth / 12);
  const monthIndex = ((rawMonth % 12) + 12) % 12;
  const day = preferredDay ?? parts.day;
  if (!Number.isSafeInteger(day) || day < 1 || day > 31) {
    throw new FinanceError("INVALID_INPUT", "preferred day must be from 1 to 31", { day });
  }
  const clampedDay = Math.min(day, daysInMonth(year, monthIndex + 1));
  return [
    String(year).padStart(4, "0"),
    String(monthIndex + 1).padStart(2, "0"),
    String(clampedDay).padStart(2, "0"),
  ].join("-");
}

export function resolveEndDate(input: {
  startDate: IsoDate;
  endDate?: IsoDate;
  horizonDays?: number;
}): IsoDate {
  toEpochDay(input.startDate);
  if (input.endDate !== undefined && input.horizonDays !== undefined) {
    throw new FinanceError("INVALID_INPUT", "provide endDate or horizonDays, not both");
  }
  if (input.endDate !== undefined) {
    if (compareIsoDates(input.endDate, input.startDate) < 0) {
      throw new FinanceError("INVALID_DATE_RANGE", "endDate must not precede startDate", input);
    }
    return input.endDate;
  }
  if (!Number.isSafeInteger(input.horizonDays) || (input.horizonDays ?? 0) <= 0) {
    throw new FinanceError("MISSING_CONTEXT", "a positive horizonDays or endDate is required", {
      missingFields: ["endDate", "horizonDays"],
    });
  }
  return addDays(input.startDate, input.horizonDays! - 1);
}
