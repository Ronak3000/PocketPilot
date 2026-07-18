import { z } from 'zod';

export const ConstitutionRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  evaluatorName: z.string(), // Stable reason code
  parameters: z.record(z.string(), z.any()).optional(),
});

export type ConstitutionRule = z.infer<typeof ConstitutionRuleSchema>;

export const MoneyConstitutionSchema = z.object({
  userId: z.string(),
  rules: z.array(ConstitutionRuleSchema),
});

export type MoneyConstitution = z.infer<typeof MoneyConstitutionSchema>;
