import { addDays, dateParts } from "../dates/date-utils";
import { sortWarnings } from "../constitution/evaluate-rules";
import { FinanceError } from "../errors";
import type { FinancialEvent, ScenarioInput, ScenarioResult } from "../types";
import { simulateBaseScenario } from "./simulate-buy-now";

function delayEvent(event: FinancialEvent, days: number): FinancialEvent {
  if (event.schedule === "once") return { ...event, date: addDays(event.date, days) };
  const startDate = addDays(event.startDate, days);
  return {
    ...event,
    startDate,
    endDate: event.endDate ? addDays(event.endDate, days) : undefined,
    dayOfMonth:
      event.frequency === "monthly" ? dateParts(startDate).day : event.dayOfMonth,
  };
}

export function simulateIncomeDelay(input: ScenarioInput): ScenarioResult {
  const stress = input.incomeDelay;
  if (
    !stress ||
    !stress.eventIds.length ||
    !Number.isSafeInteger(stress.delayDays) ||
    stress.delayDays <= 0
  ) {
    throw new FinanceError(
      "MISSING_CONTEXT",
      "income-delay scenario requires eventIds and positive delayDays",
      { missingFields: ["incomeDelay"] },
    );
  }
  const selectedIds = new Set(stress.eventIds);
  const matchingEvents = input.events.filter((event) => selectedIds.has(event.id));
  if (matchingEvents.length !== selectedIds.size) {
    throw new FinanceError("INVALID_INPUT", "income-delay event id was not found");
  }
  if (matchingEvents.some((event) => event.direction !== "inflow")) {
    throw new FinanceError("INVALID_INPUT", "income delay can shift only inflows");
  }
  const result = simulateBaseScenario(
    {
      ...input,
      events: input.events.map((event) =>
        selectedIds.has(event.id) ? delayEvent(event, stress.delayDays) : event,
      ),
    },
    input.proposal,
    "income_delay",
  );
  result.warnings = sortWarnings([
    ...result.warnings,
    {
      code: "INCOME_DEPENDENCY",
      severity: "caution",
      data: {
        delayedEventIds: stress.eventIds.join(","),
        delayDays: stress.delayDays,
      },
    },
  ]);
  return result;
}
