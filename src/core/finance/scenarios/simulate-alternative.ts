import { FinanceError } from "../errors";
import type { ScenarioInput, ScenarioResult } from "../types";
import { simulateBaseScenario } from "./simulate-buy-now";

export function simulateAlternative(input: ScenarioInput): ScenarioResult {
  if (!input.alternativeProposal) {
    throw new FinanceError(
      "MISSING_CONTEXT",
      "alternative scenario requires an explicit proposal",
      { missingFields: ["alternativeProposal"] },
    );
  }
  return simulateBaseScenario(input, input.alternativeProposal, "alternative");
}
