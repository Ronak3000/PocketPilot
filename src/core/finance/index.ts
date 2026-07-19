import { evaluateConstitution as evaluateRules } from "./constitution/evaluate-rules";
import { calculateGoalDelay as goalDelay } from "./goals/calculate-goal-delay";
import { calculateSafeToSpend as safeToSpend } from "./safe-to-spend/calculate-safe-to-spend";
import { compareScenarioResults } from "./scenarios/compare-scenarios";
import { simulateAlternative } from "./scenarios/simulate-alternative";
import { simulateBuyNow } from "./scenarios/simulate-buy-now";
import { simulateDelay } from "./scenarios/simulate-delay";
import { simulateIncomeDelay } from "./scenarios/simulate-income-delay";
import type {
  ConstitutionEvaluation,
  GoalDelayInput,
  GoalDelayResult,
  MoneyConstitution,
  SafeToSpendInput,
  SafeToSpendResult,
  ScenarioComparison,
  ScenarioInput,
  ScenarioResult,
} from "./types";

export * from "./errors";
export type * from "./types";

export function simulateScenario(input: ScenarioInput): ScenarioResult {
  switch (input.scenarioType) {
    case "buy_now":
      return simulateBuyNow(input);
    case "delay":
      return simulateDelay(input);
    case "alternative":
      return simulateAlternative(input);
    case "income_delay":
      return simulateIncomeDelay(input);
  }
}

export function compareScenarios(inputs: ScenarioInput[]): ScenarioComparison {
  const results = inputs.map(simulateScenario);
  const conflicts = new Map(
    results.map((result, index) => [
      result.id,
      inputs[index].constitution
        ? evaluateRules(result, inputs[index].constitution!).warnings.length
        : 0,
    ]),
  );
  return compareScenarioResults(results, conflicts);
}

export function evaluateConstitution(
  result: ScenarioResult,
  constitution: MoneyConstitution,
): ConstitutionEvaluation {
  return evaluateRules(result, constitution);
}

export function calculateSafeToSpend(
  input: SafeToSpendInput,
): SafeToSpendResult {
  return safeToSpend(input);
}

export function calculateGoalDelay(input: GoalDelayInput): GoalDelayResult {
  return goalDelay(input);
}
