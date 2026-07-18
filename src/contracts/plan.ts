import { z } from 'zod';
import { FutureReceiptSchema } from './evaluation';

export const ActionPlanSchema = z.object({
  planId: z.string(),
  receipt: FutureReceiptSchema,
  approvedAt: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export type ActionPlan = z.infer<typeof ActionPlanSchema>;
