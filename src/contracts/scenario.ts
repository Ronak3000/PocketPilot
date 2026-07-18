import { z } from 'zod';
import { FinancialProfileSchema } from './profile';
import { ExtractedDecisionSchema } from './decision';

export const ScenarioInputSchema = z.object({
  profile: FinancialProfileSchema,
  decision: ExtractedDecisionSchema,
  assumptions: z.record(z.string(), z.any()).optional(),
});

export type ScenarioInput = z.infer<typeof ScenarioInputSchema>;

export const ScenarioResultSchema = z.object({
  scenarioId: z.string(),
  newMonthlyCashflowPaise: z.number().int(),
  projectedBalancePaise: z.number().int(),
  goalDelayMonths: z.number().int(),
});

export type ScenarioResult = z.infer<typeof ScenarioResultSchema>;

export const ScenarioComparisonSchema = z.object({
  baseScenario: ScenarioResultSchema,
  alternativeScenarios: z.array(ScenarioResultSchema),
});

export type ScenarioComparison = z.infer<typeof ScenarioComparisonSchema>;
