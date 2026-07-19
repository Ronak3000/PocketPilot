import { ScenarioResult, ConstitutionEvaluation, FutureReceipt } from '../../contracts';

export async function generateExplanation(
  scenario: ScenarioResult,
  evaluation: ConstitutionEvaluation,
  persona: 'GEN_Z' | 'CORPORATE' | 'MINIMALIST' = 'GEN_Z'
): Promise<FutureReceipt> {
  
  // Mock synthesis layer
  let explanation = '';
  if (evaluation.isSafe) {
    explanation = persona === 'GEN_Z' 
      ? 'Vibe check passed! You can afford this, your balance is safe.'
      : 'Based on your cash flow projections, this expenditure is within acceptable risk tolerances.';
  } else {
    explanation = persona === 'GEN_Z'
      ? `Big yikes! This drops your balance by ₹${scenario.projectedBalancePaise / 100} and violates ${evaluation.violations.join(', ')}.`
      : `Caution advised. This action violates rule(s): ${evaluation.violations.join(', ')}.`;
  }

  return {
    scenarioId: scenario.scenarioId,
    summary: evaluation.isSafe ? 'Safe to proceed' : 'Not recommended',
    personaAdaptedExplanation: explanation,
    confidence: 0.95
  };
}
