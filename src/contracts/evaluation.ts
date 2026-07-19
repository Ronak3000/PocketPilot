import { z } from 'zod';

export const ConstitutionEvaluationSchema = z.object({
  isSafe: z.boolean(),
  violations: z.array(z.string()), // Array of rule IDs / reason codes
});

export type ConstitutionEvaluation = z.infer<typeof ConstitutionEvaluationSchema>;

export const FutureReceiptSchema = z.object({
  scenarioId: z.string(),
  summary: z.string(),
  personaAdaptedExplanation: z.string(),
  confidence: z.number().min(0).max(1),
});

export type FutureReceipt = z.infer<typeof FutureReceiptSchema>;
