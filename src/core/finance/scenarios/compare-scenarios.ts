import type {
  ScenarioComparison,
  ScenarioResult,
} from "../types";

export function compareScenarioResults(
  results: ScenarioResult[],
  constitutionConflictCounts: Map<string, number> = new Map(),
): ScenarioComparison {
  return {
    scenarios: results.map((result) => ({
      scenarioId: result.id,
      label: result.label,
      ...result.summary,
      constitutionConflictCount: constitutionConflictCounts.get(result.id) ?? 0,
    })),
  };
}
