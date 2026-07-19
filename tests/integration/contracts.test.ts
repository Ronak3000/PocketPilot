import { describe, it, expect } from 'vitest';
import { 
  FinancialProfileSchema, 
  ExtractedDecisionSchema, 
  ScenarioInputSchema 
} from '../../src/contracts';

describe('Contracts Validations', () => {
  it('should validate a valid financial profile', () => {
    const validProfile = {
      id: 'user-123',
      currentBalancePaise: 5000000,
      monthlyIncomePaise: 10000000,
      incomeTiming: '1st of month',
      rentPaise: 2000000,
      recurringObligations: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Internet',
          amountPaise: 150000,
          type: 'EXPENSE',
          date: '2023-10-15',
          isRecurring: true,
        }
      ],
      existingEmisPaise: 0,
      activeGoals: ['Emergency Fund'],
    };

    const result = FinancialProfileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it('should reject invalid paise amounts (negative)', () => {
    const invalidProfile = {
      id: 'user-123',
      currentBalancePaise: -5000000,
      monthlyIncomePaise: 10000000,
      incomeTiming: '1st of month',
      rentPaise: 2000000,
      recurringObligations: [],
      existingEmisPaise: 0,
      activeGoals: [],
    };

    const result = FinancialProfileSchema.safeParse(invalidProfile);
    expect(result.success).toBe(false);
  });

  it('should validate an extracted decision correctly', () => {
    const validDecision = {
      decisionType: 'PURCHASE',
      title: 'New Phone',
      listedPricePaise: 5999900,
      confidence: 0.95,
      missingFields: [],
    };

    const result = ExtractedDecisionSchema.safeParse(validDecision);
    expect(result.success).toBe(true);
  });
  
  it('should reject out of bounds confidence', () => {
    const invalidDecision = {
      decisionType: 'PURCHASE',
      title: 'New Phone',
      listedPricePaise: 5999900,
      confidence: 1.5,
      missingFields: [],
    };

    const result = ExtractedDecisionSchema.safeParse(invalidDecision);
    expect(result.success).toBe(false);
  });
});
