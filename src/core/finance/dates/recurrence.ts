import { FinanceError } from "../errors";
import type { FinancialEvent, IsoDate } from "../types";
import {
  addDays,
  addMonthsClamped,
  compareIsoDates,
  dateParts,
  resolveEndDate,
} from "./date-utils";

export function generateRecurringDates(
  event: Extract<FinancialEvent, { schedule: "recurring" }>,
  rangeStartDate: IsoDate,
  rangeEndDate: IsoDate,
): IsoDate[] {
  resolveEndDate({ startDate: rangeStartDate, endDate: rangeEndDate });
  const interval = event.interval ?? 1;
  if (!Number.isSafeInteger(interval) || interval <= 0) {
    throw new FinanceError("INVALID_INPUT", "recurrence interval must be positive", {
      eventId: event.id,
      interval,
    });
  }
  const eventEndDate =
    event.endDate && compareIsoDates(event.endDate, rangeEndDate) < 0
      ? event.endDate
      : rangeEndDate;
  if (compareIsoDates(event.startDate, eventEndDate) > 0) return [];

  const dates: IsoDate[] = [];
  if (event.frequency === "weekly") {
    for (
      let date = event.startDate;
      compareIsoDates(date, eventEndDate) <= 0;
      date = addDays(date, interval * 7)
    ) {
      if (compareIsoDates(date, rangeStartDate) >= 0) dates.push(date);
    }
    return dates;
  }

  const preferredDay = event.dayOfMonth ?? dateParts(event.startDate).day;
  if (!Number.isSafeInteger(preferredDay) || preferredDay < 1 || preferredDay > 31) {
    throw new FinanceError("INVALID_INPUT", "monthly recurrence day must be from 1 to 31", {
      eventId: event.id,
      dayOfMonth: preferredDay,
    });
  }
  for (
    let date = addMonthsClamped(event.startDate, 0, preferredDay), month = 0;
    compareIsoDates(date, eventEndDate) <= 0;
    month += interval, date = addMonthsClamped(event.startDate, month, preferredDay)
  ) {
    if (
      compareIsoDates(date, event.startDate) >= 0 &&
      compareIsoDates(date, rangeStartDate) >= 0
    ) {
      dates.push(date);
    }
  }
  return [...new Set(dates)];
}

export function eventDatesInRange(
  event: FinancialEvent,
  rangeStartDate: IsoDate,
  rangeEndDate: IsoDate,
): IsoDate[] {
  if (event.schedule === "once") {
    return compareIsoDates(event.date, rangeStartDate) >= 0 &&
      compareIsoDates(event.date, rangeEndDate) <= 0
      ? [event.date]
      : [];
  }
  return generateRecurringDates(event, rangeStartDate, rangeEndDate);
}
