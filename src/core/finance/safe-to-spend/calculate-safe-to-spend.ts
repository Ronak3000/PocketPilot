import { addDays, compareIsoDates, toEpochDay } from "../dates/date-utils";
import { eventDatesInRange } from "../dates/recurrence";
import { sortWarnings } from "../constitution/evaluate-rules";
import { FinanceError } from "../errors";
import {
  addPaise,
  assertNonNegativePaise,
  multiplyPaise,
} from "../money/money";
import type {
  FinancialEvent,
  IsoDate,
  SafeToSpendInput,
  SafeToSpendResult,
} from "../types";

function findNextIncomeDate(events: FinancialEvent[], startDate: IsoDate): IsoDate | undefined {
  const searchEndDate = addDays(startDate, 730);
  return events
    .filter((event) => event.direction === "inflow")
    .flatMap((event) => eventDatesInRange(event, startDate, searchEndDate))
    .filter((date) => compareIsoDates(date, startDate) >= 0)
    .sort()[0];
}

export function calculateSafeToSpend(
  input: SafeToSpendInput,
): SafeToSpendResult {
  assertNonNegativePaise(input.currentBalancePaise, "currentBalancePaise");
  assertNonNegativePaise(
    input.protectedBalanceFloorPaise,
    "protectedBalanceFloorPaise",
  );
  toEpochDay(input.startDate);
  const nextIncomeDate =
    input.nextIncomeDate ?? findNextIncomeDate(input.events, input.startDate);
  if (!nextIncomeDate) {
    throw new FinanceError("MISSING_CONTEXT", "next income timing is required", {
      missingFields: ["nextIncomeDate"],
    });
  }
  if (compareIsoDates(nextIncomeDate, input.startDate) < 0) {
    throw new FinanceError("INVALID_DATE_RANGE", "next income cannot precede startDate");
  }
  const protectedIds = new Set(input.protectedEventIds);
  const knownIds = new Set(input.events.map((event) => event.id));
  const unknownIds = input.protectedEventIds.filter((id) => !knownIds.has(id));
  if (unknownIds.length) {
    throw new FinanceError("INVALID_INPUT", "protected event id was not found", {
      unknownIds,
    });
  }
  const commitmentEndDate =
    compareIsoDates(nextIncomeDate, input.startDate) === 0
      ? null
      : addDays(nextIncomeDate, -1);
  let protectedCommitmentsPaise = 0;
  if (commitmentEndDate) {
    for (const event of input.events.filter(
      (candidate) =>
        candidate.direction === "outflow" && protectedIds.has(candidate.id),
    )) {
      const occurrences = eventDatesInRange(
        event,
        input.startDate,
        commitmentEndDate,
      );
      assertNonNegativePaise(event.amountPaise, `events.${event.id}.amountPaise`);
      protectedCommitmentsPaise = addPaise(
        protectedCommitmentsPaise,
        multiplyPaise(event.amountPaise, occurrences.length),
      );
    }
  }
  const amountAvailableUntilNextIncomePaise =
    input.currentBalancePaise - protectedCommitmentsPaise;
  const bufferRemainingPaise =
    amountAvailableUntilNextIncomePaise - input.protectedBalanceFloorPaise;
  return {
    safeToSpendPaise: Math.max(0, bufferRemainingPaise),
    protectedCommitmentsPaise,
    protectedBalanceFloorPaise: input.protectedBalanceFloorPaise,
    amountAvailableUntilNextIncomePaise,
    bufferRemainingPaise,
    nextIncomeDate,
    warnings: sortWarnings(input.confidenceWarnings ?? []),
  };
}
