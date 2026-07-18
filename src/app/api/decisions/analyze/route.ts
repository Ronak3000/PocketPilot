import { NextResponse } from 'next/server';
import { db } from '../../../../server/db';
import { DecisionInputSchema } from '../../../../contracts';
import { runAIWorkflow } from '../../../../core/ai/workflow';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = DecisionInputSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    
    const profile = db.getProfile();
    const constitution = db.getConstitution();
    
    if (!profile || !constitution) {
      return NextResponse.json({ error: 'Missing profile or constitution' }, { status: 400 });
    }

    // Call workflow
    const outcome = await runAIWorkflow(result.data, profile, constitution);
    return NextResponse.json(outcome);
    
  } catch (error) {
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
