import { addDays } from "../dates/date-utils";
import { FinanceError } from "../errors";
import type { ScenarioInput, ScenarioResult } from "../types";
import { simulateBaseScenario } from "./simulate-buy-now";

export function simulateDelay(input: ScenarioInput): ScenarioResult {
  if (!Number.isSafeInteger(input.delayDays) || (input.delayDays ?? 0) <= 0) {
    throw new FinanceError("MISSING_CONTEXT", "delay scenario requires positive delayDays", {
      missingFields: ["delayDays"],
    });
  }
  return simulateBaseScenario(
    input,
    {
      ...input.proposal,
      purchaseDate: addDays(input.proposal.purchaseDate, input.delayDays!),
    },
    "delay",
  );
}
