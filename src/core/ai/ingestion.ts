import { DecisionInput, ExtractedDecision } from '../../contracts';

// In a full implementation, this would call @google/genai or Vercel AI SDK
// to extract structured data from `input.text` and `input.images`
export async function extractDecision(input: DecisionInput): Promise<ExtractedDecision> {
  // Mock AI extraction for MVP/testing purposes
  const mockDecision: ExtractedDecision = {
    decisionType: 'PURCHASE',
    title: input.text?.includes('phone') ? 'New Phone' : 'Unknown Purchase',
    listedPricePaise: input.text?.includes('59999') ? 5999900 : undefined,
    confidence: 0.9,
    missingFields: []
  };

  return mockDecision;
}
