import { FinancialProfile, ExtractedDecision } from '../../contracts';

export interface MissingContextResponse {
  isMissing: boolean;
  missingField?: string;
  userFacingQuestion?: string;
}

export function checkMissingFields(
  profile: FinancialProfile,
  decision: ExtractedDecision
): MissingContextResponse {
  
  if (!decision.listedPricePaise) {
    return {
      isMissing: true,
      missingField: 'listedPricePaise',
      userFacingQuestion: 'How much does this cost?'
    };
  }

  // Example: If it's a purchase and we know they want EMI, check if we have tenure
  if (decision.decisionType === 'PURCHASE_EMI' && !decision.tenureMonths) {
    return {
      isMissing: true,
      missingField: 'tenureMonths',
      userFacingQuestion: 'How many months is the EMI for?'
    };
  }

  return { isMissing: false };
}
