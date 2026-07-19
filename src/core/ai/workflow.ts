import { DecisionInput, FinancialProfile, MoneyConstitution } from '../../contracts';
import { extractDecision } from './ingestion';
import { checkMissingFields } from './contextGate';
import { generateExplanation } from './synthesis';

export async function runAIWorkflow(
  input: DecisionInput, 
  profile: FinancialProfile, 
  constitution: MoneyConstitution
) {
  // 1. Extract
  const decision = await extractDecision(input);

  // 2. Validate Context
  const contextCheck = checkMissingFields(profile, decision);
  if (contextCheck.isMissing) {
    return { status: 'MISSING_CONTEXT', details: contextCheck };
  }

  // 3. Finance Engine Call (Mocked for now since Task 2 owns this)
  const mockScenario = {
    scenarioId: `scen-${Date.now()}`,
    newMonthlyCashflowPaise: profile.monthlyIncomePaise - (decision.monthlyAmountPaise || 0),
    projectedBalancePaise: profile.currentBalancePaise - (decision.upfrontAmountPaise || decision.listedPricePaise || 0),
    goalDelayMonths: 0
  };

  // 4. Constitution Evaluation (Mocked)
  const evaluation = {
    isSafe: mockScenario.projectedBalancePaise > 1000000,
    violations: mockScenario.projectedBalancePaise > 1000000 ? [] : ['BALANCE_FLOOR']
  };

  // 5. Synthesis
  const receipt = await generateExplanation(mockScenario, evaluation, 'GEN_Z');

  return { status: 'SUCCESS', receipt, scenario: mockScenario, decision };
}
