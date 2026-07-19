import { FinanceError } from "../errors";
import { addPaise, assertNonNegativePaise, assertSafeInteger } from "../money/money";
import type {
  AppliedFinancialEvent,
  DailyLedgerEntry,
  FinancialEvent,
  IsoDate,
  LedgerInput,
} from "../types";
import { addDays, compareIsoDates, resolveEndDate } from "../dates/date-utils";
import { eventDatesInRange } from "../dates/recurrence";

function compareAppliedEvents(left: AppliedFinancialEvent, right: AppliedFinancialEvent): number {
  if (left.direction !== right.direction) return left.direction === "inflow" ? -1 : 1;
  return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
}

function expandEvents(
  events: FinancialEvent[],
  startDate: IsoDate,
  endDate: IsoDate,
): Map<IsoDate, AppliedFinancialEvent[]> {
  const byDate = new Map<IsoDate, AppliedFinancialEvent[]>();
  const occurrences = new Set<string>();
  for (const event of events) {
    if (!event.id) throw new FinanceError("INVALID_INPUT", "event id is required");
    assertNonNegativePaise(event.amountPaise, `events.${event.id}.amountPaise`);
    for (const date of eventDatesInRange(event, startDate, endDate)) {
      const occurrenceKey = `${event.id}\u0000${date}`;
      if (occurrences.has(occurrenceKey)) {
        throw new FinanceError("INVALID_INPUT", "duplicate event occurrence", {
          eventId: event.id,
          date,
        });
      }
      occurrences.add(occurrenceKey);
      const applied: AppliedFinancialEvent = {
        id: event.id,
        title: event.title,
        amountPaise: event.amountPaise,
        direction: event.direction,
        kind: event.kind,
        protected: event.protected ?? false,
      };
      byDate.set(date, [...(byDate.get(date) ?? []), applied]);
    }
  }
  for (const appliedEvents of byDate.values()) appliedEvents.sort(compareAppliedEvents);
  return byDate;
}

export function buildDailyLedger(input: LedgerInput): DailyLedgerEntry[] {
  const endDate = resolveEndDate(input);
  assertSafeInteger(input.startingBalancePaise, "startingBalancePaise");
  const floor = input.protectedBalanceFloorPaise ?? 0;
  assertNonNegativePaise(floor, "protectedBalanceFloorPaise");
  if (input.lowBalanceThresholdPaise !== undefined) {
    assertNonNegativePaise(input.lowBalanceThresholdPaise, "lowBalanceThresholdPaise");
  }
  const eventsByDate = expandEvents(input.events, input.startDate, endDate);
  const ledger: DailyLedgerEntry[] = [];
  let openingBalancePaise = input.startingBalancePaise;

  for (
    let date = input.startDate;
    compareIsoDates(date, endDate) <= 0;
    date = addDays(date, 1)
  ) {
    const appliedEvents = eventsByDate.get(date) ?? [];
    const inflowsPaise = appliedEvents
      .filter((event) => event.direction === "inflow")
      .reduce((sum, event) => addPaise(sum, event.amountPaise), 0);
    const outflowsPaise = appliedEvents
      .filter((event) => event.direction === "outflow")
      .reduce((sum, event) => addPaise(sum, event.amountPaise), 0);
    const closingBalancePaise = addPaise(
      openingBalancePaise,
      inflowsPaise,
      -outflowsPaise,
    );
    const riskIndicators: DailyLedgerEntry["riskIndicators"] = [];
    if (closingBalancePaise < floor) riskIndicators.push("BELOW_PROTECTED_FLOOR");
    if (closingBalancePaise < 0) riskIndicators.push("NEGATIVE_BALANCE");
    ledger.push({
      date,
      openingBalancePaise,
      inflowsPaise,
      outflowsPaise,
      closingBalancePaise,
      appliedEvents,
      riskIndicators,
    });
    openingBalancePaise = closingBalancePaise;
  }
  return ledger;
}
