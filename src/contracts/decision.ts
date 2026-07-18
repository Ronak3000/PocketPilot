import { z } from 'zod';

export const DecisionInputSchema = z.object({
  text: z.string().optional(),
  images: z.array(z.string()).optional(), // Base64 or URLs
});

export type DecisionInput = z.infer<typeof DecisionInputSchema>;

export const ExtractedDecisionSchema = z.object({
  decisionType: z.string(),
  title: z.string(),
  listedPricePaise: z.number().int().nonnegative().optional(),
  upfrontAmountPaise: z.number().int().nonnegative().optional(),
  monthlyAmountPaise: z.number().int().nonnegative().optional(),
  tenureMonths: z.number().int().nonnegative().optional(),
  processingFeePaise: z.number().int().nonnegative().optional(),
  purchaseDate: z.string().optional(), // ISO String
  sourceEvidence: z.string().optional(),
  confidence: z.number().min(0).max(1),
  missingFields: z.array(z.string()),
});

export type ExtractedDecision = z.infer<typeof ExtractedDecisionSchema>;
