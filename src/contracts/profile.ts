import { z } from 'zod';

export const FinancialEventSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  amountPaise: z.number().int().nonnegative(),
  type: z.enum(['INCOME', 'EXPENSE']),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  isRecurring: z.boolean(),
});

export type FinancialEvent = z.infer<typeof FinancialEventSchema>;

export const FinancialProfileSchema = z.object({
  id: z.string(),
  currentBalancePaise: z.number().int().nonnegative(),
  monthlyIncomePaise: z.number().int().nonnegative(),
  incomeTiming: z.string(),
  rentPaise: z.number().int().nonnegative(),
  recurringObligations: z.array(FinancialEventSchema),
  existingEmisPaise: z.number().int().nonnegative(),
  activeGoals: z.array(z.string()),
});

export type FinancialProfile = z.infer<typeof FinancialProfileSchema>;
