import { NextResponse } from 'next/server';
import { db } from '../../../../server/db';
import { ScenarioInputSchema } from '../../../../contracts';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = ScenarioInputSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid scenario input' }, { status: 400 });
    }
    
    // In a real implementation, this would call Task 2's finance engine
    // For now, we mock a ScenarioResult
    const mockResult = {
      scenarioId: `scen-${Date.now()}`,
      newMonthlyCashflowPaise: 500000,
      projectedBalancePaise: 6000000,
      goalDelayMonths: 2
    };

    db.saveScenario(mockResult.scenarioId, mockResult);
    return NextResponse.json(mockResult);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create simulation' }, { status: 500 });
  }
}
